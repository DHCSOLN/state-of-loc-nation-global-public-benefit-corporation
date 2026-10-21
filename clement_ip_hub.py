import json
import os
import requests

class ClementIPHub:
    def __init__(self, sources_path="sources.json"):
        self.sources_path = sources_path
        # REPOINTED: Successfully set the target baseline threshold to 10 Billion views
        self.performance_threshold = 10000000000  
        
        # Simulated multi-platform API endpoints (e.g., Ayrshare or direct platform aggregators)
        self.analytics_api_url = "https://ayrshare.com"
        self.api_key = os.getenv("SOCIAL_ANALYTICS_API_KEY")

    def map_api_to_ledger(self, api_response):
        """Converts live analytics platform data back into our standardized repo data structure."""
        local_data = self.load_local_ledger()
        api_metrics = api_response.get("analytics", {})
        
        for asset in local_data.get("content_assets", []):
            platform_lower = asset.get("platform", "").lower()
            if platform_lower in api_metrics:
                asset["current_views"] = api_metrics[platform_lower].get("viewCount", asset["current_views"])
                
        return local_data

    def fetch_live_metrics(self):
        """Fetches live view counts from platform APIs or falls back to local ledger."""
        if not self.api_key:
            print("ℹ️ No API Key found in environment variables. Pulling data from local storage...")
            return self.load_local_ledger()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {"platforms": ["youtube", "tiktok", "instagram"]}
        
        try:
            response = requests.post(self.analytics_api_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                print("🎯 Successfully synced live social media metrics!")
                return self.map_api_to_ledger(response.json())
        except Exception as e:
            print(f"⚠️ API Connection failed ({e}). Falling back to local data.")
            
        return self.load_local_ledger()

    def load_local_ledger(self):
        """Loads repository tracking database."""
        if not os.path.exists(self.sources_path):
            initial_data = {
                "content_assets": [
                    {"id": "video_01", "title": "IP Launch", "platform": "YouTube", "current_views": 142000, "url": "https://youtube.com"},
                    {"id": "video_01", "title": "IP Launch", "platform": "TikTok", "current_views": 31000, "url": "https://tiktok.com"},
                    {"id": "video_01", "title": "IP Launch", "platform": "Instagram", "current_views": 12000, "url": "https://instagram.com"}
                ]
            }
            self.save_ledger(initial_data)
            return initial_data
        
        with open(self.sources_path, "r") as f:
            return json.load(f)

    def save_ledger(self, data):
        """Saves current asset state back to repo."""
        with open(self.sources_path, "w") as f:
            json.dump(data, f, indent=4)

    def generate_boost_metadata(self, title, low_platform, target_url):
        """Generates dynamic cross-promotional copy tailored to boost low reach channels."""
        template = (
            f"🔥 CO-RELEASE: Check out '{title}' trending now across our networks!\n"
            f"👇 We notice our community is missing out over here. Jump in and show support on {low_platform}:\n"
            f"🔗 {target_url}\n"
            f"#IntellectualProperty #ContentHub #Trending #Growth"
        )
        return template

    def execute_boost_audit(self):
        """Audits platforms and populates boost text directly inside tracking ledger."""
        data = self.fetch_live_metrics()
        assets = data.get("content_assets", [])
        
        # 1. Identify which platforms are underperforming compared to your 10B target
        low_performing = [a for a in assets if a.get("current_views", 0) < self.performance_threshold]
        
        if not low_performing:
            print(f"🏆 All platforms are hitting the {self.performance_threshold:,} view target uniformly.")
            return

        print(f"⚠️ Found {len(low_performing)} platforms staggering below {self.performance_threshold:,} views.")
        
        # 2. Match low links to high links and embed the generated cross-promotion text
        for asset in assets:
            if asset.get("current_views", 0) >= self.performance_threshold:
                # This channel is healthy, give it the boost copy to post
                boost_ctas = []
                for low in low_performing:
                    boost_ctas.append(self.generate_boost_metadata(low['title'], low['platform'], low['url']))
                
                # Append boost copy to this asset block
                asset["active_boost_copy"] = "\n\n---\n\n".join(boost_ctas)
                print(f"✅ Generated cross-promotional boost text for your healthy channel: [{asset['platform']}]")
            else:
                asset["active_boost_copy"] = "Target channel receiving traffic."

        # Save updates to sources.json so you can copy/paste or use external push routines
        self.save_ledger(data)

if __name__ == "__main__":
    hub = ClementIPHub()
    hub.execute_boost_audit()
