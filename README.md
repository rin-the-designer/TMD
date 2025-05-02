# Interactive News Map

An interactive world map that displays political news and developments for different countries. The application uses D3.js for map visualization and integrates with OpenAI's GPT API for generating news summaries.

## Features

- Interactive world map with country highlighting
- Real-time news articles from NewsAPI
- AI-generated political news summaries
- Responsive design
- Modal view for detailed news content

## Setup

1. Clone the repository:

```bash
git clone https://github.com/rin-the-designer/TMD.git
cd TMD
```

2. Create a `config.js` file with your API keys:

```javascript
const OPENAI_API_KEY = "your-openai-api-key";
const NEWS_API_KEY = "your-newsapi-key";
```

3. Open `index.html` in your browser or serve it using a local server.

## Technologies Used

- D3.js for map visualization
- OpenAI GPT API for news summaries
- NewsAPI for real-time news articles
- HTML5, CSS3, and JavaScript

## License

MIT License
