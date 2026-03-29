import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { generateKWGTBuffer } from './src/server/kwgtBuilder.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  /**
   * Express Route Handler: Serve KWGT Buffer
   * 
   * Architectural Reasoning:
   * To trigger a direct file download in the client browser, we must set the 
   * \`Content-Disposition\` header to \`attachment\` and specify the \`.kwgt\` filename.
   * The \`Content-Type\` is set to \`application/zip\` because a KWGT file is structurally
   * a standard ZIP archive.
   */
  app.post('/api/export-kwgt', async (req, res) => {
    try {
      const jsonPayload = req.body;
      
      // Generate the uncompressed buffer
      const kwgtBuffer = await generateKWGTBuffer(jsonPayload);

      // Configure HTTP response headers for binary file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="custom_dashboard.kwgt"');
      res.setHeader('Content-Length', kwgtBuffer.length);

      // Stream the raw buffer to the client
      res.send(kwgtBuffer);
    } catch (error) {
      console.error('KWGT Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate KWGT archive' });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
