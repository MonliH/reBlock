from datasets import load_dataset, concatenate_datasets
from transformers import AutoTokenizer, DataCollatorForTokenClassification

dataset = load_dataset("jonatli/youtube-sponsor", use_auth_token=True)
tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v3-small")

label_list = ["N", "Y"]


def tokenize_and_align_labels(examples):
    tokenized_inputs = tokenizer(
        examples["tokens"], truncation=True, is_split_into_words=True, padding=True
    )

    labels = []
    for i, label in enumerate(examples[f"tags"]):
        word_ids = tokenized_inputs.word_ids(
            batch_index=i
        )  # Map tokens to their respective word.
        previous_word_idx = None
        label_ids = []
        for word_idx in word_ids:  # Set the special tokens to -100.
            if word_idx is None:
                label_ids.append(-100)
            elif (
                word_idx != previous_word_idx
            ):  # Only label the first token of a given word.
                value = label[word_idx]
                if value == "N":
                    label_ids.append(0)
                elif value == "Y":
                    label_ids.append(1)
                else:
                    raise ValueError("unexpected value %s" % value)
            else:
                label_ids.append(-100)
            previous_word_idx = word_idx
        labels.append(label_ids)

    tokenized_inputs["labels"] = labels
    return tokenized_inputs


tokenized_db = dataset.map(tokenize_and_align_labels, batched=True)
data_collator = DataCollatorForTokenClassification(tokenizer)

from transformers import AutoModelForTokenClassification, TrainingArguments, Trainer

model = AutoModelForTokenClassification.from_pretrained(
    "microsoft/deberta-v3-small", num_labels=len(label_list)
)
training_args = TrainingArguments(
    output_dir="./results_deberta",
    evaluation_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    num_train_epochs=5,
    weight_decay=0.01,
)
new_train = concatenate_datasets([tokenized_db["train"], tokenized_db["test"]])
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=new_train,
    eval_dataset=tokenized_db["validation"],
    eval_strategy="epoch",
    data_collator=data_collator,
    tokenizer=tokenizer,
)
trainer.train()
trainer.save_model(output_dir="./results_deberta")
