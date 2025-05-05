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
    .attr("data-name", d => d.properties.name)
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
      openModal(d.properties.name);
    });
});

async function fetchArticleMetadata(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Get Open Graph image
    const ogImage =
      doc.querySelector('meta[property="og:image"]')?.content ||
      doc.querySelector('meta[name="twitter:image"]')?.content ||
      doc.querySelector('meta[property="og:image:secure_url"]')?.content;

    // Get title
    const title =
      doc.querySelector('meta[property="og:title"]')?.content ||
      doc.querySelector("title")?.textContent ||
      doc.querySelector("h1")?.textContent;

    // Get publication date
    const date =
      doc.querySelector('meta[property="article:published_time"]')?.content ||
      doc.querySelector('meta[name="publication-date"]')?.content ||
      doc.querySelector("time")?.getAttribute("datetime");

    return {
      title: title?.trim() || "Article Title Not Found",
      image: ogImage || null,
      date: date ? new Date(date).toLocaleDateString() : "Date Not Available",
    };
  } catch (error) {
    console.error("Error fetching article metadata:", error);
    return {
      title: "Article Title Not Found",
      image: null,
      date: "Date Not Available",
    };
  }
}

async function openModal(countryName) {
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
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        countryName
      )}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${NEWS_API_KEY}`
    );

    if (!newsResponse.ok) {
      throw new Error("Failed to fetch news articles");
    }

    const newsData = await newsResponse.json();
    const articles = newsData.articles;

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
              <p class="article-description">${article.description}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
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