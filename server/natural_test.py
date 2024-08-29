from accelerate import init_empty_weights, load_checkpoint_and_dispatch
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoConfig
import warnings
import os

warnings.filterwarnings("ignore")
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

if torch.cuda.is_available():
    print(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
    device = torch.device("cuda")
else:
    print("CUDA is not available. Using CPU.")
    device = torch.device("cpu")

questions = ['Show me the day with the most users joining', 'Show me the project that has a task with the most comments', 'What is the ratio of users with gmail addresses vs without?']

try:
    model_name = "model-00001-of-00003"  # Replace with your actual model name
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    
    # Load model with accelerate
    config = AutoConfig.from_pretrained(model_name)
    with init_empty_weights():
        model = AutoModelForCausalLM.from_config(config)
    model = load_checkpoint_and_dispatch(model, model_name, device_map="auto", no_split_module_classes=["OPTDecoderLayer"])

    print(f"Model loaded. Device map: {model.hf_device_map}")

    for question in questions:
        messages = [{"role": "user", "content": question}]
        inputs = tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = model.generate(
                inputs, 
                max_new_tokens=512, 
                do_sample=False, 
                top_k=50, 
                top_p=0.95, 
                num_return_sequences=1, 
                eos_token_id=32023
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Question: {question}")
        print(f"Response: {response}\n")

except Exception as e:
    print(f"An error occurred: {str(e)}")

if torch.cuda.is_available():
    print(f"GPU memory allocated: {torch.cuda.memory_allocated(device)/1e6:.2f} MB")
    print(f"GPU memory reserved: {torch.cuda.memory_reserved(device)/1e6:.2f} MB")