import requests
from youtube_transcript_api._transcripts import TranscriptListFetcher


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


print(
    " ".join(l["w"].strip() for l in get_transcript("7ziWrneMYss", requests.Session()))
)
