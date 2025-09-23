import os
from huggingface_hub import InferenceClient
import gradio as gr

# Configuration: set these as Secrets in the Space
HF_TOKEN = os.environ.get("HF_TOKEN")
HF_MODEL = os.environ.get("HF_MODEL", "fofr/sdxl-emoji")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable not set. Add it to Space Secrets.")

client = InferenceClient(api_key=HF_TOKEN)

# Example: text_to_image wrapper
def text_to_image(prompt: str, width: int = 1024, height: int = 1024, guidance_scale: float = 7.5):
    try:
        result = client.text_to_image(
            prompt,
            model=HF_MODEL,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
        )
        # result may be a PIL.Image or list
        if isinstance(result, list):
            img = result[0]
        else:
            img = result
        return img
    except Exception as e:
        return f"Error generating image: {e}"

# Simple text-generation endpoint using Inference API
def text_generate(prompt: str, max_tokens: int = 150):
    try:
        resp = client.text_generation(
            prompt,
            model=HF_MODEL,
            parameters={"max_new_tokens": int(max_tokens)}
        )
        # resp may be string or dict
        if isinstance(resp, dict) and resp.get("generated_text"):
            return resp.get("generated_text")
        return str(resp)
    except Exception as e:
        return f"Error generating text: {e}"

# Gradio UI
with gr.Blocks() as demo:
    gr.Markdown("# Nutri-Coach HF Proxy Space")
    with gr.Tab("Text to Image"):
        txt = gr.Textbox(lines=3, placeholder="A cute red panda chef cooking sushi")
        w = gr.Slider(256, 2048, value=1024, step=64, label="Width")
        h = gr.Slider(256, 2048, value=1024, step=64, label="Height")
        g = gr.Slider(0.0, 20.0, value=7.5, step=0.1, label="Guidance scale")
        out_img = gr.Image(type="pil")
        btn = gr.Button("Generate Image")
        btn.click(text_to_image, inputs=[txt, w, h, g], outputs=out_img)

    with gr.Tab("Text Generation"):
        prompt = gr.Textbox(lines=4, placeholder="Explain whether apples are healthy")
        tokens = gr.Slider(1, 1024, value=150, label="Max tokens")
        out_txt = gr.Textbox()
        gen = gr.Button("Generate")
        gen.click(text_generate, inputs=[prompt, tokens], outputs=out_txt)

if __name__ == "__main__":
    demo.launch()
