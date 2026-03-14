'use client';

import { useState, useEffect } from "react";
import { Twitter, Youtube, Twitch, Facebook, Instagram, Globe } from "lucide-react";
import { groupsApi } from "@/lib/api";

// Custom SVG icons for platforms not in Lucide
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.21 8.21 0 0 0 4.76 1.52V7.05a4.84 4.84 0 0 1-1-.36z"/>
  </svg>
);

// Map platform keys to their icon components and colors
const PLATFORM_CONFIG: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  discord: { name: "Discord", icon: DiscordIcon, color: "text-[#5865F2]" },
  twitter: { name: "Twitter", icon: Twitter, color: "text-[#1DA1F2]" },
  youtube: { name: "YouTube", icon: Youtube, color: "text-[#FF0000]" },
  twitch: { name: "Twitch", icon: Twitch, color: "text-[#9146FF]" },
  facebook: { name: "Facebook", icon: Facebook, color: "text-[#1877F2]" },
  instagram: { name: "Instagram", icon: Instagram, color: "text-[#E4405F]" },
  tiktok: { name: "TikTok", icon: TikTokIcon, color: "text-[#000000] dark:text-[#FFFFFF]" },
  website: { name: "Website", icon: Globe, color: "text-blue-600" },
};

interface FormattedLink {
  name: string;
  url: string;
  platform: string;
  title?: string;
}

interface SocialLinksData {
  discord?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  discord_title?: string;
  twitter_title?: string;
  youtube_title?: string;
  twitch_title?: string;
  facebook_title?: string;
  instagram_title?: string;
  tiktok_title?: string;
  website_title?: string;
}

export default function SocialLinksSection({ groupId }: { groupId?: string }) {
  const [socialLinks, setSocialLinks] = useState<FormattedLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      try {
        const response = await groupsApi.getGroupSocialLinks(groupId);
        if (response.success && response.data) {
          const links = response.data.socialLinks as SocialLinksData;
          const formattedLinks: FormattedLink[] = [];
          const platforms = ["discord", "twitter", "youtube", "twitch", "facebook", "instagram", "tiktok", "website"] as const;

          for (const platform of platforms) {
            const url = links[platform];
            if (url) {
              const titleKey = `${platform}_title` as keyof SocialLinksData;
              formattedLinks.push({
                name: PLATFORM_CONFIG[platform]?.name || platform,
                url,
                platform,
                title: (links[titleKey] as string) || undefined,
              });
            }
          }

          setSocialLinks(formattedLinks);
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Social Links</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (socialLinks.length === 0) {
    return null; // Don't show section if no links
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Social Links</h2>
      
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((link) => {
          const config = PLATFORM_CONFIG[link.platform];
          if (!config) return null;
          const IconComponent = config.icon;
          return (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <IconComponent className={`w-6 h-6 ${config.color}`} />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {link.title || config.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

