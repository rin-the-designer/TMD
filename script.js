const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map").attr("width", width).attr("height", height);

const g = svg.append("g"); // group for all countries
const projection = d3
  .geoMercator()
  .scale((height * 0.6) / Math.PI)
  .translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);

let zoom = d3
  .zoom()
  .scaleExtent([1, 8])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

// Function to shift map elements
function shiftMapElements(shift) {
  const currentTransform = d3.zoomTransform(svg.node());
  const newTransform = d3.zoomIdentity
    .translate(currentTransform.x + shift, currentTransform.y)
    .scale(currentTransform.k);

  svg.transition().duration(750).call(zoom.transform, newTransform);
}

function zoomToCountry(countryFeature) {
  const [[x0, y0], [x1, y1]] = path.bounds(countryFeature);
  const shift = -width * 0.125; // Shift by half of the modal width

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2 + shift, height / 2)
        .scale(
          Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
        )
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    );
}

d3.json("world.geo.json").then((data) => {
  g.selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("data-name", (d) => d.properties.name)
    .attr("data-iso", (d) => d.properties.iso_a2)
    .attr("fill", "#292929")
    .attr("stroke", "#9b9b9b")
    .attr("stroke-width", 0.1)
    .on("mouseover", function () {
      d3.select(this).attr("fill", "#dffe14");
    })
    .on("mouseout", function () {
      if (!d3.select(this).classed("selected")) {
        d3.select(this).attr("fill", "#292929");
      }
    })
    .on("click", function (event, d) {
      // Reset all countries to default color
      g.selectAll("path").attr("fill", "#292929").classed("selected", false);
      // Set clicked country to yellow and mark as selected
      d3.select(this).attr("fill", "#dffe14").classed("selected", true);

      // Update the country selector in the header
      const countrySelector = document.querySelector(".country-selector");
      countrySelector.classList.add("selected");
      countrySelector.querySelector("span").textContent = d.properties.name;

      zoomToCountry(d);
      openModal(d.properties.name, d.properties.iso_a2);
    });
});

// Function to normalize country names for search
function normalizeCountryName(countryName) {
  const nameMap = {
    "United States of America": ["United States", "US", "USA"],
    "United Kingdom of Great Britain and Northern Ireland": [
      "United Kingdom",
      "UK",
      "Great Britain",
      "Britain",
    ],
    "Russian Federation": ["Russia", "Russian Federation"],
    "Republic of Korea": ["South Korea", "Korea"],
    "Democratic People's Republic of Korea": ["North Korea", "DPRK"],
    "Islamic Republic of Iran": ["Iran"],
    "Syrian Arab Republic": ["Syria"],
    "Lao People's Democratic Republic": ["Laos"],
    "Republic of the Union of Myanmar": ["Myanmar", "Burma"],
    "Kingdom of Eswatini": ["Eswatini", "Swaziland"],
    "United Republic of Tanzania": ["Tanzania"],
    "Republic of the Congo": ["Congo"],
    "Democratic Republic of the Congo": [
      "DR Congo",
      "Democratic Republic of Congo",
    ],
    "Republic of Moldova": ["Moldova"],
    "Republic of the Sudan": ["Sudan"],
    "Republic of South Sudan": ["South Sudan"],
    "Republic of the Niger": ["Niger"],
    "Republic of the Gambia": ["Gambia"],
    "Republic of the Philippines": ["Philippines"],
    "Republic of the Marshall Islands": ["Marshall Islands"],
    "Republic of the Fiji Islands": ["Fiji"],
    "Republic of the Seychelles": ["Seychelles"],
    "Republic of the Maldives": ["Maldives"],
    "Republic of the Comoros": ["Comoros"],
    "Republic of the Mauritius": ["Mauritius"],
    "Republic of the Cape Verde": ["Cape Verde"],
    "Republic of the São Tomé and Príncipe": ["São Tomé and Príncipe"],
    "Republic of the Equatorial Guinea": ["Equatorial Guinea"],
    "Republic of the Guinea-Bissau": ["Guinea-Bissau"],
    "Republic of the Sierra Leone": ["Sierra Leone"],
    "Republic of the Liberia": ["Liberia"],
    "Republic of the Côte d'Ivoire": ["Ivory Coast", "Côte d'Ivoire"],
    "Republic of the Burkina Faso": ["Burkina Faso"],
    "Republic of the Mali": ["Mali"],
    "Republic of the Mauritania": ["Mauritania"],
    "Republic of the Senegal": ["Senegal"],
    "Republic of the Guinea": ["Guinea"],
    "Republic of the Cameroon": ["Cameroon"],
    "Republic of the Gabon": ["Gabon"],
    "Republic of the Central African Republic": ["Central African Republic"],
    "Republic of the Chad": ["Chad"],
    "Republic of the Libya": ["Libya"],
    "Republic of the Tunisia": ["Tunisia"],
    "Republic of the Algeria": ["Algeria"],
    "Republic of the Morocco": ["Morocco"],
    "Republic of the Western Sahara": ["Western Sahara"],
    "Republic of the Egypt": ["Egypt"],
    "Republic of the Eritrea": ["Eritrea"],
    "Republic of the Djibouti": ["Djibouti"],
    "Republic of the Somalia": ["Somalia"],
    "Republic of the Ethiopia": ["Ethiopia"],
    "Republic of the Kenya": ["Kenya"],
    "Republic of the Uganda": ["Uganda"],
    "Republic of the Rwanda": ["Rwanda"],
    "Republic of the Burundi": ["Burundi"],
    "Republic of the Angola": ["Angola"],
    "Republic of the Zambia": ["Zambia"],
    "Republic of the Malawi": ["Malawi"],
    "Republic of the Mozambique": ["Mozambique"],
    "Republic of the Zimbabwe": ["Zimbabwe"],
    "Republic of the Botswana": ["Botswana"],
    "Republic of the Namibia": ["Namibia"],
    "Republic of the South Africa": ["South Africa"],
    "Republic of the Lesotho": ["Lesotho"],
    "Republic of the Eswatini": ["Eswatini"],
  };

  const variations = nameMap[countryName] || [countryName];
  return variations;
}

// List of trusted news domains
const TRUSTED_NEWS_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bloomberg.com",
  "wsj.com",
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "bbc.com",
  "bbc.co.uk",
  "aljazeera.com",
  "ft.com",
  "economist.com",
  "time.com",
  "npr.org",
  "politico.com",
  "foreignpolicy.com",
  "foreignaffairs.com",
  "theatlantic.com",
  "newyorker.com",
  "newsweek.com",
  "usatoday.com",
  "latimes.com",
  "chicagotribune.com",
  "bostonglobe.com",
  "politico.eu",
  "euobserver.com",
  "europeanvoice.com",
  "handelsblatt.com",
  "lemonde.fr",
  "lefigaro.fr",
  "elpais.com",
  "corriere.it",
  "repubblica.it",
  "faz.net",
  "spiegel.de",
  "zeit.de",
  "nrc.nl",
  "volkskrant.nl",
  "aftenposten.no",
  "svd.se",
  "dn.se",
  "hs.fi",
  "politiken.dk",
  "berlingske.dk",
  "japantimes.co.jp",
  "asahi.com",
  "mainichi.jp",
  "straitstimes.com",
  "scmp.com",
  "theaustralian.com.au",
  "smh.com.au",
  "nzherald.co.nz",
  "stuff.co.nz",
  "globeandmail.com",
  "nationalpost.com",
  "haaretz.com",
  "timesofindia.indiatimes.com",
  "thehindu.com",
  "dawn.com",
  "thedailystar.net",
  "bangkokpost.com",
  "nationmultimedia.com",
  "philstar.com",
  "manilatimes.net",
  "vietnamnews.vn",
  "tuoitrenews.vn",
  "koreatimes.co.kr",
  "koreaherald.com",
  "japantoday.com",
  "mainichi.jp",
  "asahi.com",
  "chinadaily.com.cn",
  "globaltimes.cn",
  "straitstimes.com",
  "channelnewsasia.com",
  "thejakartapost.com",
  "thestar.com.my",
  "bangkokpost.com",
  "nationmultimedia.com",
  "philstar.com",
  "manilatimes.net",
  "vietnamnews.vn",
  "tuoitrenews.vn",
  "koreatimes.co.kr",
  "koreaherald.com",
  "japantoday.com",
  "mainichi.jp",
  "asahi.com",
  "chinadaily.com.cn",
  "globaltimes.cn",
  "straitstimes.com",
  "channelnewsasia.com",
  "thejakartapost.com",
  "thestar.com.my",
  "cnn.com",
  "cnbc.com",
  "pbs.org",
  "cbsnews.com",
  "dailymail.co.uk",
  "foxnews.com",
  "foxbusiness.com",
  "thetelegraph.co.uk",
  "chosun.com",
  "donga.com",
  "joongang.co.kr",
].join(",");

async function openModal(countryName, countryCode) {
  document.getElementById("modal").classList.add("open");
  document.getElementById("country-name").innerText = countryName;
  document.getElementById(
    "news-content"
  ).innerHTML = `<p>Loading news for ${countryName}...</p>`;

  try {
    // First, get the AI summary
    const summaryResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano-2025-04-14",
          messages: [
            {
              role: "system",
              content:
                "You are a news analyst providing concise, factual summaries of recent political developments in different countries. Focus on major political events, policy changes, and significant political figures. Keep the summary brief and informative.",
            },
            {
              role: "user",
              content: `Provide a brief summary of recent political news and developments in ${countryName}. Focus on the most significant events from the past few months.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!summaryResponse.ok) {
      throw new Error(`API Error: ${summaryResponse.statusText}`);
    }

    const summaryData = await summaryResponse.json();
    const newsSummary = summaryData.choices[0].message.content;

    // Then, fetch real news articles from NewsAPI
    const countryVariations = normalizeCountryName(countryName);
    const countryQuery = countryVariations
      .map((name) => `+${name}`)
      .join(" OR ");
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        `(${countryQuery}) AND (politics OR government OR president OR elections OR impeachment OR "approval rating")`
      )}&searchIn=title&language=en&sortBy=publishedAt&pageSize=6&domains=${TRUSTED_NEWS_DOMAINS}&apiKey=${NEWS_API_KEY}`
    );

    if (!newsResponse.ok) {
      console.error("News API Error:", await newsResponse.text()); // Debug log
      throw new Error(
        `Failed to fetch news articles: ${newsResponse.statusText}`
      );
    }

    const newsData = await newsResponse.json();
    console.log("News API Response:", newsData); // Debug log

    if (!newsData.articles || newsData.articles.length === 0) {
      console.log("No articles found for country:", countryName); // Debug log
      document.getElementById("news-content").innerHTML = `
        <div class="news-summary">
          <p>${newsSummary}</p>
          <p class="disclaimer">Note: The summary above is AI-generated based on recent events.</p>
        </div>
        <div class="news-articles">
          <h3>Recent News Articles</h3>
          <p>No recent political news articles found from major news sources for ${countryName}. This could be due to limited English-language coverage of political developments in ${countryName}.</p>
        </div>
      `;
      return;
    }

    const articles = newsData.articles;
    console.log(
      "Article titles:",
      articles.map((a) => a.title)
    ); // Debug log to check titles

    // Combine AI summary with real news articles
    document.getElementById("news-content").innerHTML = `
      <div class="news-summary">
        <p>${newsSummary}</p>
        <p class="disclaimer">Note: The summary above is AI-generated based on recent events.</p>
      </div>
      <div class="news-articles">
        <h3>Recent News Articles</h3>
        ${articles
          .map(
            (article) => `
          <div class="news-article">
            ${
              article.urlToImage
                ? `
              <div class="article-image">
                <img src="${article.urlToImage}" alt="${article.title}" onerror="this.style.display='none'">
              </div>
            `
                : ""
            }
            <div class="article-content">
              <h4><a href="${
                article.url
              }" target="_blank" rel="noopener noreferrer">${
              article.title
            }</a></h4>
              <p class="article-source">${article.source.name} • ${new Date(
              article.publishedAt
            ).toLocaleDateString()}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    const firstArticleUrl = articles[0]?.url || "";
    document.getElementById("news-content").innerHTML += `
      <button id="analyzeBtn" data-url="${firstArticleUrl}" style="margin-top:1em;">
        Analyze First Article Sentiment & Bias
      </button>
      <pre id="analysisResult" style="margin-top:.5em; white-space: pre-wrap;"></pre>
    `;
    const analyzeBtn = document.getElementById("analyzeBtn");
    analyzeBtn.addEventListener("click", async () => {
      const resultBox = document.getElementById("analysisResult");
      const articleUrl = analyzeBtn.dataset.url;
      if (!articleUrl) {
        resultBox.textContent = "No article URL available to analyze.";
        return;
      }
      resultBox.textContent = "Loading full article…";
      try {
        // get full text
        const fullResp = await fetch("http://127.0.0.1:5000/fulltext", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: articleUrl }),
        });
        if (!fullResp.ok) throw new Error(fullResp.statusText);
        const { fulltext } = await fullResp.json();
    
        //and call sentiment analysis
        resultBox.textContent = "Analyzing full text…";
        const analyzeResp = await fetch("http://127.0.0.1:5000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fulltext }),
        });
        if (!analyzeResp.ok) throw new Error(analyzeResp.statusText);
        const { analysis } = await analyzeResp.json();
    
        
        let parsed;
        try {
          parsed = JSON.parse(analysis);
          resultBox.innerHTML = `
            <strong>Sentiment:</strong> ${parsed.sentiment}<br>
            <strong>Bias Detected:</strong> ${parsed.bias_detected}<br>
            ${parsed.bias_explanation
              ? `<strong>Explanation:</strong> ${parsed.bias_explanation}`
              : ""}
          `;
        } catch {
          
          resultBox.textContent = analysis;
        }
      } catch (err) {
        console.error(err);
        resultBox.textContent = "Error: " + err.message;
      }
    });
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("news-content").innerHTML = `
      <div class="error-message">
        <p>Sorry, we couldn't fetch the news at this time. Please try again later.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

// Update close button handler to reset map position
document.getElementById("closeBtn").addEventListener("click", () => {
  document.getElementById("modal").classList.remove("open");
  // Reset map position
  const currentTransform = d3.zoomTransform(svg.node());
  const newTransform = d3.zoomIdentity
    .translate(currentTransform.x + width * 0.125, currentTransform.y)
    .scale(currentTransform.k);

  svg.transition().duration(750).call(zoom.transform, newTransform);
});
