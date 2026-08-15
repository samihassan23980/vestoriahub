// app/lib/indexnow.js

export async function submitToIndexNow(urlList) {
  // Apna exact domain aur API key yahan likhein (bina https:// ke)
  const HOST = "www.eouponfinder.com"; 
  const API_KEY = "0345a4ef45b44a3b917efd80121986d7"; // e.g., "32b1abc345..."
  const KEY_LOCATION = `https://${HOST}/${API_KEY}.txt`;

  try {
    // Hum api.indexnow.org use karenge kyun ke ye Bing, Yandex sab ko ek sath ping karta hai
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: "www.eouponfinder.com",
        key: "0345a4ef45b44a3b917efd80121986d7",
        keyLocation: "https://www.eouponfinder.com/0345a4ef45b44a3b917efd80121986d7.txt",
        urlList: urlList, // Ye array of URLs hoga
      }),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ IndexNow: Successfully submitted ${urlList.length} URLs.`);
      return true;
    } else {
      console.error("❌ IndexNow Error:", response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error("❌ IndexNow Network Error:", error);
    return false;
  }
}