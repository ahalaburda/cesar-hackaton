require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testArgentinosFinal() {
  try {
    console.log('🧉 Prueba final: Mono rosa con gorra de Argentinos Juniors');
    
    const ai = new GoogleGenAI({ apiKey: "AIzaSyCne-dUq5bWd585-OAvxvlwkQ_L6_gqRm4" });
    
    // Read the base image
    const fs = require('fs');
    const path = require('path');
    const baseImagePath = path.join(__dirname, 'src/assets/base_monkey.png');
    const baseImage = fs.readFileSync(baseImagePath);
    const base64Image = baseImage.toString('base64');
    
    const prompt = "Cambia este mono a color rosa y agrega una gorra de Argentinos Juniors. Mantén el mismo estilo y proporciones del mono original, solo cambia el color a rosa y agrega la gorra de Argentinos Juniors.";
    
    console.log('🎨 Generando mono rosa con gorra de Argentinos Juniors...');
    console.log('Prompt:', prompt);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ],
    });
    
    console.log('✅ Respuesta recibida');
    
    // Check if we got an image
    let imageFound = false;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log('🎉 ¡Imagen generada exitosamente!');
        console.log('MIME Type:', part.inlineData.mimeType);
        console.log('Data length:', part.inlineData.data.length);
        
        // Save the image
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const outputPath = path.join(__dirname, 'argentinos_juniors_monkey_final.png');
        fs.writeFileSync(outputPath, buffer);
        console.log('🖼️ Imagen guardada como:', outputPath);
        
        imageFound = true;
        break;
      }
    }
    
    if (!imageFound) {
      console.log('❌ No se encontró imagen en la respuesta');
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log('📝 Respuesta de texto:', part.text);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.status === 429) {
      console.log('⚠️ Cuota excedida - Intenta más tarde');
    } else if (error.status === 404) {
      console.log('⚠️ Modelo no encontrado');
    } else {
      console.log('⚠️ Error desconocido');
    }
  }
}

testArgentinosFinal();
