import JSZip from 'jszip';
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
    const zip = new JSZip();
    
    // Create the required folder structure for a .kwgt file
    const fontsFolder = zip.folder("fonts");
    const iconsFolder = zip.folder("icons");
    const bitmapsFolder = zip.folder("bitmaps");

    if (!fontsFolder || !iconsFolder || !bitmapsFolder) {
      throw new Error("Failed to create folder structure for .kwgt export.");
    }

    // Add custom files if provided
    if (options?.fonts && options.fonts.length > 0) {
      for (const font of options.fonts) {
        fontsFolder.file(font.name, font.file);
      }
    } else {
      fontsFolder.file(".gitkeep", "");
    }

    if (options?.icons && options.icons.length > 0) {
      for (const icon of options.icons) {
        iconsFolder.file(icon.name, icon.file);
      }
    } else {
      iconsFolder.file(".gitkeep", "");
    }

    if (options?.bitmaps && options.bitmaps.length > 0) {
      for (const bitmap of options.bitmaps) {
        bitmapsFolder.file(bitmap.name, bitmap.file);
      }
    } else {
      bitmapsFolder.file(".gitkeep", "");
    }
    
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

    // Attempt to parse kodes into actual modules if possible, otherwise add as raw text
    if (widget.kodes) {
      try {
        // Very basic attempt to see if kodes is already a JSON array of modules
        const parsedKodes = JSON.parse(widget.kodes);
        if (Array.isArray(parsedKodes)) {
           viewgroupItems.push(...parsedKodes);
        } else if (typeof parsedKodes === 'object') {
           viewgroupItems.push(parsedKodes);
        } else {
           throw new Error("Not a valid module array/object");
        }
      } catch (e) {
        // If it's just raw text formulas, add them as a text module
        viewgroupItems.push({
          "internal_type": "TextModule",
          "text_expression": widget.kodes,
          "text_size": 30.0,
          "position_padding_top": 100.0,
          "position_padding_left": 50.0
        });
      }
    }

    // Generate a dynamic title from the prompt (first 3 words) or use provided title
    const dynamicTitle = options?.title || widget.prompt.split(' ').slice(0, 3).join(' ') || 'KustomGen Widget';

    const presetJson = {
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
    
    zip.file("preset.json", JSON.stringify(presetJson, null, 2));
    
    // Generate the zip file as a blob
    const blob = await zip.generateAsync({ type: "blob" });
    
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
