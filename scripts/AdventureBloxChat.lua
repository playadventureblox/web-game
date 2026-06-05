-- AdventureBlox Bubble Chat System
-- Version 1.0
-- Place this script in ServerScriptService in Roblox Studio

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Chat = game:GetService("Chat")

-- Disable default Roblox chat
game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.Chat, false)

-- Chat filter - blocked words and patterns
local BLOCKED_PATTERNS = {
	-- Profanity (add more as needed)
	"fuck", "shit", "ass", "bitch", "damn", "crap",
	-- Personal info patterns
	"%d%d%d%-%d%d%d%-%d%d%d%d", -- phone numbers
	"%d%d%d%d%d%d%d%d%d%d",     -- 10 digit numbers
	-- Links
	"https?://", "www%.", "%.com", "%.net", "%.org", "%.gg",
	-- Discord/social
	"discord%.gg", "discord%.com", "instagram", "snapchat", "tiktok",
}

-- Bubble chat settings
local BUBBLE_DURATION = 8       -- seconds before bubble disappears
local MAX_BUBBLE_WIDTH = 200    -- max width in pixels
local MAX_MESSAGE_LENGTH = 150  -- max characters per message
local BUBBLE_Y_OFFSET = 2.5    -- height above character

-- Remote events
local remoteFolder = Instance.new("Folder")
remoteFolder.Name = "AdventureBloxChat"
remoteFolder.Parent = ReplicatedStorage

local sendMessageEvent = Instance.new("RemoteEvent")
sendMessageEvent.Name = "SendMessage"
sendMessageEvent.Parent = remoteFolder

local receiveMessageEvent = Instance.new("RemoteEvent")
receiveMessageEvent.Name = "ReceiveMessage"
receiveMessageEvent.Parent = remoteFolder

-- Chat filter function
local function filterMessage(message)
	if #message > MAX_MESSAGE_LENGTH then
		message = message:sub(1, MAX_MESSAGE_LENGTH) .. "..."
	end

	local filtered = message:lower()
	for _, pattern in ipairs(BLOCKED_PATTERNS) do
		if filtered:match(pattern) then
			return nil, "Message blocked by chat filter."
		end
	end

	return message, nil
end

-- Server: handle incoming messages
sendMessageEvent.OnServerEvent:Connect(function(player, message)
	if typeof(message) ~= "string" then return end

	-- Trim whitespace
	message = message:match("^%s*(.-)%s*$")
	if message == "" then return end

	-- Filter message
	local filtered, err = filterMessage(message)
	if err then
		-- Send error back to player only
		receiveMessageEvent:FireClient(player, {
			type = "error",
			message = err,
		})
		return
	end

	-- Broadcast to all players in game
	receiveMessageEvent:FireAllClients({
		type = "message",
		playerId = player.UserId,
		playerName = player.Name,
		displayName = player.DisplayName,
		message = filtered,
		timestamp = os.time(),
	})
end)

-- Server: notify when player joins/leaves
Players.PlayerAdded:Connect(function(player)
	receiveMessageEvent:FireAllClients({
		type = "system",
		message = player.DisplayName .. " joined the game.",
	})
end)

Players.PlayerRemoving:Connect(function(player)
	receiveMessageEvent:FireAllClients({
		type = "system",
		message = player.DisplayName .. " left the game.",
	})
end)

print("[AdventureBlox Chat] Server initialized successfully.")
