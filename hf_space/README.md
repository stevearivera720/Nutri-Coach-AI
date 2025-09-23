Nutri-Coach HF Space

This folder contains a small Gradio app that proxies calls to the Hugging Face Inference API.

Files:
- app.py: Gradio app. Uses `huggingface_hub.InferenceClient` to call text_to_image and text_generation.
- requirements.txt: Python deps.

Setup (on Hugging Face Spaces):
1. Create a new Space (Gradio runtime).
2. Upload these files.
3. In Space Settings -> Secrets, add `HF_TOKEN` with a Hugging Face token that has inference access.
4. (Optional) Set `HF_MODEL` to the model repo id you want to use, e.g. `fofr/sdxl-emoji` or `google/flan-t5-large`.
5. Deploy the Space and call the JSON API at `https://<your-space>.hf.space/api/predict` from your site.

Security note: the HF token is stored as a secret in the Space and not exposed to clients. The Space will bill the HF account for Inference API requests.
