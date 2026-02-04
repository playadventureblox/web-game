"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { groupsApi } from "@/lib/api";

interface Member {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  joined_at: string;
  role_id?: string;
  role_name?: string;
}

interface Role {
  id: string;
  name: string;
  rank: number;
}

interface MembersSectionProps {
  groupId?: string;
}


export default function MembersSection({ groupId }: MembersSectionProps) {
  const [selectedRole, setSelectedRole] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Fetch members and roles
  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      setLoading(true);
      try {
        // Fetch members
        const membersResponse = await groupsApi.getGroupMembers(groupId);
        if (membersResponse.success && membersResponse.data) {
          setMembers((membersResponse.data.members as Member[]) || []);
        }

        // Fetch roles
        const rolesResponse = await groupsApi.getGroupRoles(groupId);
        if (rolesResponse.success && rolesResponse.data) {
          setRoles((rolesResponse.data.roles as Role[]) || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  // Filter members by role
  const filteredMembers = members.filter((member) => {
    return selectedRole === "all" || member.role_id === selectedRole;
  });
  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Members
          </h2>

          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page 1</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-2 min-w-[140px] px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span>
                {selectedRole === "all" 
                  ? "All Members" 
                  : roles.find(r => r.id === selectedRole)?.name || "Select Role"}
              </span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-full min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-20 py-1 max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedRole("all");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      selectedRole === "all"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    All Members
                  </button>
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        selectedRole === role.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <a
              key={member.id}
              href={`/profile/${member.username}`}
              className="group flex flex-col items-center"
            >
              <div className="w-[100px] h-[100px] border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                <Image
                  src={`https://robohash.org/${member.username}?set=set3`}
                  alt={member.display_name || member.username}
                  fill
                  className="object-cover group-hover:opacity-90 transition-opacity"
                  sizes="100px"
                />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 truncate w-[100px] text-center">
                {member.display_name || member.username}
              </p>
            </a>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
            No members found with this role.
          </p>
        )}
      </div>
    </div>
  );
}
