-- AdventureBlox Bubble Chat Client
-- Version 1.0
-- Place this script in StarterPlayerScripts in Roblox Studio

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for remote events
local remoteFolder = ReplicatedStorage:WaitForChild("AdventureBloxChat")
local sendMessageEvent = remoteFolder:WaitForChild("SendMessage")
local receiveMessageEvent = remoteFolder:WaitForChild("ReceiveMessage")

-- Settings
local BUBBLE_DURATION = 8
local BUBBLE_Y_OFFSET = 2.5
local CHAT_COLOR = Color3.fromRGB(255, 255, 255)
local SYSTEM_COLOR = Color3.fromRGB(255, 214, 0)
local ERROR_COLOR = Color3.fromRGB(255, 80, 80)
local BUBBLE_BG = Color3.fromRGB(30, 30, 30)
local BUBBLE_OPACITY = 0.85

-- Active bubbles per player
local activeBubbles = {}

-- Create main GUI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "AdventureBloxChatGui"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = playerGui

-- Chat input frame
local chatFrame = Instance.new("Frame")
chatFrame.Name = "ChatFrame"
chatFrame.Size = UDim2.new(0, 400, 0, 44)
chatFrame.Position = UDim2.new(0.5, -200, 1, -60)
chatFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
chatFrame.BackgroundTransparency = 0.2
chatFrame.BorderSizePixel = 0
chatFrame.Visible = false
chatFrame.Parent = screenGui

local chatCorner = Instance.new("UICorner")
chatCorner.CornerRadius = UDim.new(0, 8)
chatCorner.Parent = chatFrame

local chatInput = Instance.new("TextBox")
chatInput.Name = "ChatInput"
chatInput.Size = UDim2.new(1, -70, 1, -10)
chatInput.Position = UDim2.new(0, 10, 0, 5)
chatInput.BackgroundTransparency = 1
chatInput.TextColor3 = Color3.fromRGB(255, 255, 255)
chatInput.PlaceholderText = "Type a message..."
chatInput.PlaceholderColor3 = Color3.fromRGB(180, 180, 180)
chatInput.Text = ""
chatInput.TextSize = 14
chatInput.Font = Enum.Font.GothamMedium
chatInput.TextXAlignment = Enum.TextXAlignment.Left
chatInput.ClearTextOnFocus = false
chatInput.Parent = chatFrame

local sendButton = Instance.new("TextButton")
sendButton.Name = "SendButton"
sendButton.Size = UDim2.new(0, 55, 1, -10)
sendButton.Position = UDim2.new(1, -60, 0, 5)
sendButton.BackgroundColor3 = Color3.fromRGB(0, 120, 255)
sendButton.BorderSizePixel = 0
sendButton.Text = "Send"
sendButton.TextColor3 = Color3.fromRGB(255, 255, 255)
sendButton.TextSize = 13
sendButton.Font = Enum.Font.GothamBold
sendButton.Parent = chatFrame

local sendCorner = Instance.new("UICorner")
sendCorner.CornerRadius = UDim.new(0, 6)
sendCorner.Parent = sendButton

-- Chat log frame (shows recent messages)
local logFrame = Instance.new("Frame")
logFrame.Name = "ChatLog"
logFrame.Size = UDim2.new(0, 400, 0, 160)
logFrame.Position = UDim2.new(0.5, -200, 1, -210)
logFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
logFrame.BackgroundTransparency = 0.4
logFrame.BorderSizePixel = 0
logFrame.ClipsDescendants = true
logFrame.Parent = screenGui

local logCorner = Instance.new("UICorner")
logCorner.CornerRadius = UDim.new(0, 8)
logCorner.Parent = logFrame

local logLayout = Instance.new("UIListLayout")
logLayout.SortOrder = Enum.SortOrder.LayoutOrder
logLayout.Padding = UDim.new(0, 2)
logLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom
logLayout.Parent = logFrame

local logPadding = Instance.new("UIPadding")
logPadding.PaddingLeft = UDim.new(0, 8)
logPadding.PaddingRight = UDim.new(0, 8)
logPadding.PaddingTop = UDim.new(0, 6)
logPadding.PaddingBottom = UDim.new(0, 6)
logPadding.Parent = logFrame

-- Create bubble above player head
local function createBubble(targetPlayer, message)
	local character = targetPlayer.Character
	if not character then return end

	local head = character:FindFirstChild("Head")
	if not head then return end

	-- Remove existing bubble for this player
	if activeBubbles[targetPlayer.UserId] then
		activeBubbles[targetPlayer.UserId]:Destroy()
		activeBubbles[targetPlayer.UserId] = nil
	end

	-- Create BillboardGui
	local billboard = Instance.new("BillboardGui")
	billboard.Name = "ChatBubble"
	billboard.Size = UDim2.new(0, 200, 0, 50)
	billboard.StudsOffset = Vector3.new(0, BUBBLE_Y_OFFSET, 0)
	billboard.AlwaysOnTop = false
	billboard.MaxDistance = 60
	billboard.Parent = head

	local bubble = Instance.new("Frame")
	bubble.Size = UDim2.new(1, 0, 1, 0)
	bubble.BackgroundColor3 = BUBBLE_BG
	bubble.BackgroundTransparency = BUBBLE_OPACITY
	bubble.BorderSizePixel = 0
	bubble.Parent = billboard

	local bubbleCorner = Instance.new("UICorner")
	bubbleCorner.CornerRadius = UDim.new(0, 10)
	bubbleCorner.Parent = bubble

	local bubbleText = Instance.new("TextLabel")
	bubbleText.Size = UDim2.new(1, -12, 1, -8)
	bubbleText.Position = UDim2.new(0, 6, 0, 4)
	bubbleText.BackgroundTransparency = 1
	bubbleText.TextColor3 = CHAT_COLOR
	bubbleText.Text = message
	bubbleText.TextSize = 13
	bubbleText.Font = Enum.Font.GothamMedium
	bubbleText.TextWrapped = true
	bubbleText.TextXAlignment = Enum.TextXAlignment.Center
	bubbleText.Parent = bubble

	activeBubbles[targetPlayer.UserId] = billboard

	-- Fade out after duration
	task.delay(BUBBLE_DURATION - 1, function()
		if billboard and billboard.Parent then
			local tween = TweenService:Create(bubble, TweenInfo.new(1), {
				BackgroundTransparency = 1
			})
			local textTween = TweenService:Create(bubbleText, TweenInfo.new(1), {
				TextTransparency = 1
			})
			tween:Play()
			textTween:Play()
			task.delay(1, function()
				if billboard and billboard.Parent then
					billboard:Destroy()
					activeBubbles[targetPlayer.UserId] = nil
				end
			end)
		end
	end)
end

-- Add message to chat log
local function addToLog(text, color)
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 0, 0)
	label.AutomaticSize = Enum.AutomaticSize.Y
	label.BackgroundTransparency = 1
	label.TextColor3 = color or CHAT_COLOR
	label.Text = text
	label.TextSize = 13
	label.Font = Enum.Font.GothamMedium
	label.TextWrapped = true
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.LayoutOrder = tick()
	label.Parent = logFrame

	-- Keep only last 20 messages
	local children = logFrame:GetChildren()
	local labels = {}
	for _, child in ipairs(children) do
		if child:IsA("TextLabel") then
			table.insert(labels, child)
		end
	end
	if #labels > 20 then
		table.sort(labels, function(a, b) return a.LayoutOrder < b.LayoutOrder end)
		labels[1]:Destroy()
	end

	-- Auto fade after 12 seconds
	task.delay(12, function()
		if label and label.Parent then
			local tween = TweenService:Create(label, TweenInfo.new(1), {
				TextTransparency = 1
			})
			tween:Play()
			task.delay(1, function()
				if label and label.Parent then
					label:Destroy()
				end
			end)
		end
	end)
end

-- Send message function
local function sendMessage()
	local message = chatInput.Text:match("^%s*(.-)%s*$")
	if message == "" then return end

	sendMessageEvent:FireServer(message)
	chatInput.Text = ""
end

-- Receive messages from server
receiveMessageEvent.OnClientEvent:Connect(function(data)
	if data.type == "message" then
		-- Find player
		local targetPlayer = Players:GetPlayerByUserId(data.playerId)

		-- Show bubble
		if targetPlayer then
			createBubble(targetPlayer, data.message)
		end

		-- Add to log
		local prefix = data.displayName .. ": "
		addToLog(prefix .. data.message, CHAT_COLOR)

	elseif data.type == "system" then
		addToLog("⚡ " .. data.message, SYSTEM_COLOR)

	elseif data.type == "error" then
		addToLog("⚠ " .. data.message, ERROR_COLOR)
	end
end)

-- Toggle chat with / key or Enter
UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if gameProcessed then return end

	if input.KeyCode == Enum.KeyCode.Slash or input.KeyCode == Enum.KeyCode.Return then
		chatFrame.Visible = true
		chatInput:CaptureFocus()
	end
end)

-- Send on Enter
chatInput.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		sendMessage()
	end
	chatFrame.Visible = false
end)

-- Send button click
sendButton.MouseButton1Click:Connect(function()
	sendMessage()
	chatFrame.Visible = false
end)

print("[AdventureBlox Chat] Client initialized successfully.")