import json
import sys
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_int8_training


def main(data_path: str, out_dir: str):
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    texts = data.get('transcripts', []) + data.get('personaNotes', [])
    if not texts:
        print('No training data provided', file=sys.stderr)
        return

    dataset = Dataset.from_dict({'text': texts})

    model_name = 'meta-llama/Llama-3.1-8B-Instruct'
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name, load_in_8bit=True)

    model = prepare_model_for_int8_training(model)
    config = LoraConfig(r=8, lora_alpha=16, target_modules=['q_proj', 'v_proj'], lora_dropout=0.05,
                        bias='none', task_type='CAUSAL_LM')
    model = get_peft_model(model, config)

    def tokenize(batch):
        return tokenizer(batch['text'], truncation=True, padding='max_length', max_length=256)

    tokenized = dataset.map(tokenize, batched=True, remove_columns=['text'])

    args = TrainingArguments(
        output_dir=out_dir,
        per_device_train_batch_size=1,
        num_train_epochs=1,
        logging_steps=10,
        save_strategy='epoch',
    )

    trainer = Trainer(model=model, args=args, train_dataset=tokenized)
    trainer.train()

    model.save_pretrained(out_dir)
    tokenizer.save_pretrained(out_dir)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: fine_tune_lora.py <data.json> <output_dir>')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
