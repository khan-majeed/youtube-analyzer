import express from "express";
import { createServer as createViteServer } from "vite";
import { YoutubeTranscript } from 'youtube-transcript';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch YouTube transcript
  app.get("/api/transcript", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // Extract video ID from URL
      const videoIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : videoUrl;

      let transcript;
      try {
        // Try default first
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (e) {
        // Try specifically for English if default fails
        try {
          transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        } catch (e2) {
          throw e; // Re-throw original error if both fail
        }
      }
      
      res.json({ transcript, videoId });
    } catch (error: any) {
      console.error("Transcript error:", error);
      const isDisabled = error.message?.includes('Transcript is disabled');
      res.status(500).json({ 
        error: isDisabled 
          ? "Transcripts are disabled for this video. We'll try to analyze it using web search instead." 
          : "Failed to fetch transcript. Make sure the video exists and has captions.",
        videoId: videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || videoUrl,
        isDisabled
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
