from fastapi import FastAPI, Request
import json
from fastapi.middleware.cors import CORSMiddleware
import requests
import torch
from transformers import AutoTokenizer, pipeline
from youtube_transcript_api._transcripts import TranscriptListFetcher
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache


tagger = pipeline(
    "token-classification", "./checkpoint-6000", aggregation_strategy="first"
)
tokenizer = AutoTokenizer.from_pretrained("./checkpoint-6000")
max_size = 512
classes = [False, True]

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# results = json.load(open("sample_gen2.json", "r"))


@app.post("/detect")
async def detect(request: Request):
    body = (await request.body()).decode("utf-8")
    tokens = tokenizer(body.split(" "))["input_ids"]
    current_length = 0
    current_word_length = 0
    batches = []
    for i, w in enumerate(tokens):
        word = w[1:-1]
        if (current_length + len(word)) > max_size:
            batch = " ".join(
                tokenizer.batch_decode(
                    [
                        tok[1:-1]
                        for tok in tokens[max(0, i - current_word_length - 1) : i]
                    ]
                )
            )
            batches.append(batch)
            current_word_length = 0
            current_length = 0
            continue
        current_length += len(word)
        current_word_length += 1
    if current_length > 0:
        batches.append(
            " ".join(
                tokenizer.batch_decode(
                    [tok[1:-1] for tok in tokens[i - current_word_length :]]
                )
            )
        )

    results = []
    for split in batches:
        values = tagger(split)
        results.extend(
            {
                "sponsor": v["entity_group"] == "LABEL_1",
                "phrase": v["word"],
            }
            for v in values
        )

    # json.dump(results, open("sample_gen2.json", "w"))
    return results


def process(obj):
    o = obj["events"]
    new_l = []
    start_dur = None
    for line in o:
        if "segs" in line:
            if len(line["segs"]) == 1 and line["segs"][0]["utf8"] == "\n":
                if start_dur is not None:
                    new_l.append(
                        {
                            "w": prev["utf8"],
                            "s": start_dur + prev["tOffsetMs"],
                            "e": line["tStartMs"],
                        }
                    )
                continue

            start_dur = line["tStartMs"]
            prev = line["segs"][0]
            prev["tOffsetMs"] = 0
            for word in line["segs"][1:]:
                try:
                    new_l.append(
                        {
                            "w": prev["utf8"],
                            "s": start_dur + prev["tOffsetMs"],
                            "e": start_dur + word["tOffsetMs"],
                        }
                    )
                    prev = word
                except KeyError:
                    pass

    return new_l


def get_transcript(video_id, session):
    fetcher = TranscriptListFetcher(session)
    _json = fetcher._extract_captions_json(
        fetcher._fetch_video_html(video_id), video_id
    )
    captionTracks = _json["captionTracks"]
    transcript_track_url = ""
    for track in captionTracks:
        if track["languageCode"] == "en":
            transcript_track_url = track["baseUrl"] + "&fmt=json3"

    if not transcript_track_url:
        return None

    obj = session.get(transcript_track_url)
    return process(obj.json())


sample_transcript = json.load(open("sample_transcript.json", "r"))


@app.post("/transcript")
@cache(expire=600)
async def transcript(id: str):
    # return sample_transcript
    return get_transcript(id, requests.Session())
