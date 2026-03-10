# KustomGen

KustomGen is an AI-powered tool that helps you design and build KWGT (Kustom Widget Maker) widgets for Android.

## Features

- **AI Mockup Generation**: Describe your widget, and the AI will generate a high-fidelity visual mockup.
- **Step-by-Step Instructions**: Get detailed instructions on how to structure your widget in KWGT.
- **Kode Generation**: Automatically generate the KWGT formulas (Kodes) needed for your widget's functionality.
- **Export to .kwgt**: Export your generated widget directly to a `.kwgt` file, complete with custom fonts, icons, and bitmaps.
- **Widget Wizard**: Ask the AI for suggestions on how to improve or modify your widget.

## Running Locally

To run this project on your local machine, you'll need Node.js and npm installed.

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kustomgen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase (Auth & Firestore)
- Google Gemini API
- JSZip (for creating .kwgt files)
