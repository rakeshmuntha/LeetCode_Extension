import displayRatings from "@/Utils/displayRatings";
import displayYtLinks from "@/Utils/displayYtLinks";

export default defineContentScript({
    matches: [
        "*://leetcode.com/*",
        "*://leetcode.cn/*",
    ],

    async main() {
        displayRatings();
        displayYtLinks();
    }
});