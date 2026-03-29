import { WidgetData } from '../services/firestore';

export interface KwgtExportOptions {
  bitmaps?: { file: File; name: string }[];
  fonts?: { file: File; name: string }[];
  icons?: { file: File; name: string }[];
  title?: string;
  version?: number;
  release?: number;
  pflags?: number;
}

export async function exportToKwgt(widget: WidgetData, options?: KwgtExportOptions) {
  try {
    // Parse prompt for keywords
    const promptLower = widget.prompt.toLowerCase();
    let features = "";
    const viewgroupItems: any[] = [];

    // Basic structure based on prompt
    if (promptLower.includes("clock") || promptLower.includes("time")) {
      features += "CLOCK ";
      viewgroupItems.push({
        "internal_type": "TextModule",
        "text_expression": "$df(hh:mm)$",
        "text_size": 80.0,
        "position_padding_top": 50.0,
        "position_padding_left": 50.0
      });
    }
    if (promptLower.includes("date") || promptLower.includes("calendar")) {
      features += "DATE ";
      viewgroupItems.push({
        "internal_type": "TextModule",
        "text_expression": "$df(EEEE, MMMM d)$",
        "text_size": 40.0,
        "position_padding_top": 150.0,
        "position_padding_left": 50.0
      });
    }
    if (promptLower.includes("weather")) {
      features += "WEATHER ";
      viewgroupItems.push({
        "internal_type": "TextModule",
        "text_expression": "$wi(cond)$ $wi(temp)$°",
        "text_size": 40.0,
        "position_padding_top": 200.0,
        "position_padding_left": 50.0
      });
    }
    if (promptLower.includes("battery")) {
      features += "BATTERY ";
      viewgroupItems.push({
        "internal_type": "TextModule",
        "text_expression": "$bi(level)$%",
        "text_size": 40.0,
        "position_padding_top": 250.0,
        "position_padding_left": 50.0
      });
    }
    if (promptLower.includes("music") || promptLower.includes("spotify")) {
      features += "MUSIC ";
      viewgroupItems.push({
        "internal_type": "TextModule",
        "text_expression": "$mi(title)$ - $mi(artist)$",
        "text_size": 40.0,
        "position_padding_top": 300.0,
        "position_padding_left": 50.0
      });
    }
    if (promptLower.includes("animation") || promptLower.includes("animated") || promptLower.includes("equalizer")) {
      features += "ANIMATION ";
    }
    if (promptLower.includes("gradient")) {
      features += "GRADIENT ";
    }
    if (promptLower.includes("parallax")) {
      features += "PARALLAX ";
    }
    if (promptLower.includes("neomorphic") || promptLower.includes("neumorphism")) {
      features += "NEUMORPHISM ";
    }
    if (promptLower.includes("glass") || promptLower.includes("glassmorphism")) {
      features += "GLASSMORPHISM ";
    }

    // Attempt to parse presetJson into actual modules if possible, otherwise add as raw text
    if (widget.presetJson) {
      try {
        // If it's already an object, use it directly
        if (typeof widget.presetJson === 'object' && widget.presetJson.preset_root && widget.presetJson.preset_root.viewgroup_items) {
           viewgroupItems.push(...widget.presetJson.preset_root.viewgroup_items);
        } else if (Array.isArray(widget.presetJson)) {
           viewgroupItems.push(...widget.presetJson);
        } else {
           throw new Error("Not a valid module array/object");
        }
      } catch (e) {
        // If it's just raw text formulas, add them as a text module
        viewgroupItems.push({
          "internal_type": "TextModule",
          "text_expression": JSON.stringify(widget.presetJson),
          "text_size": 30.0,
          "position_padding_top": 100.0,
          "position_padding_left": 50.0
        });
      }
    }

    // Generate a dynamic title from the prompt (first 3 words) or use provided title
    const dynamicTitle = options?.title || widget.prompt.split(' ').slice(0, 3).join(' ') || 'KustomGen Widget';

    let presetJson: any = {
      "preset_info": {
        "version": options?.version ?? 11,
        "title": dynamicTitle,
        "description": widget.prompt,
        "author": "KustomGen",
        "width": 720,
        "height": 720,
        "features": features.trim(),
        "release": options?.release ?? 351031415,
        "locked": false,
        "pflags": options?.pflags ?? 0
      },
      "preset_root": {
        "internal_events": [
          {
            "action": "NONE"
          }
        ],
        "internal_type": "RootLayerModule",
        "config_scale_value": 100.0,
        "viewgroup_items": viewgroupItems.length > 0 ? viewgroupItems : [
           {
             "internal_type": "TextModule",
             "text_expression": "Empty Widget",
             "text_size": 60.0
           }
        ]
      }
    };

    // If the AI generated a complete, perfectly formatted JSON with preset_info and preset_root, use it directly
    if (widget.presetJson && typeof widget.presetJson === 'object' && widget.presetJson.preset_root) {
      presetJson = widget.presetJson;
      
      // Ensure preset_info exists
      if (!presetJson.preset_info) {
        presetJson.preset_info = {};
      }
      
      // Merge in any missing required fields
      presetJson.preset_info.title = presetJson.preset_info.title || dynamicTitle;
      presetJson.preset_info.description = presetJson.preset_info.description || widget.prompt;
      presetJson.preset_info.author = presetJson.preset_info.author || "KustomGen";
      presetJson.preset_info.width = presetJson.preset_info.width || 720;
      presetJson.preset_info.height = presetJson.preset_info.height || 720;
      presetJson.preset_info.release = presetJson.preset_info.release || (options?.release ?? 351031415);
    }
    
    // Read files as base64
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/png;base64, part
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = error => reject(error);
      });
    };

    const fontsData = options?.fonts ? await Promise.all(options.fonts.map(async f => ({ name: f.name, data: await fileToBase64(f.file) }))) : [];
    const iconsData = options?.icons ? await Promise.all(options.icons.map(async i => ({ name: i.name, data: await fileToBase64(i.file) }))) : [];
    const bitmapsData = options?.bitmaps ? await Promise.all(options.bitmaps.map(async b => ({ name: b.name, data: await fileToBase64(b.file) }))) : [];

    // Add mockup image as preview
    let previewData = null;
    if (widget.mockupUrl) {
      try {
        const response = await fetch(widget.mockupUrl);
        const blob = await response.blob();
        previewData = await fileToBase64(new File([blob], "preview.png", { type: blob.type }));
      } catch (e) {
        console.error("Failed to add preview to zip:", e);
      }
    }

    // Call the backend API to generate the KWGT buffer
    const response = await fetch('/api/export-kwgt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presetJson,
        instructions: widget.instructions,
        fonts: fontsData,
        icons: iconsData,
        bitmaps: bitmapsData,
        preview: previewData
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend export failed: ${response.statusText}`);
    }

    // Get the binary blob from the response
    const blob = await response.blob();
    
    // Trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dynamicTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${widget.id || 'export'}.kwgt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to KWGT:", error);
    alert(`Failed to export widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
