const url =
  process.env.NODE_ENV == "development" ? "http://localhost:8000" : "something";

export interface TranscriptItem {
  // The word
  w: string;

  // The start time of the word in milliseconds
  s: number;
  // The end time of the word in milliseconds
  e: number;
}

export async function getTranscript(id: string): Promise<TranscriptItem[]> {
  const res = await fetch(`${url}/transcript?id=${id}`, {
    method: "POST",
  });
  return await res.json();
}

export function getText(transcript: TranscriptItem[]) {
  return transcript.map(({ w }) => w.trim()).join(" ");
}

export interface ClassBlock {
  // Whether this whole phrase is a sponsor
  sponsor: boolean;
  // What the phrase is
  phrase: string;
}

export async function getSponsoredPhrases(
  transcript: string
): Promise<ClassBlock[]> {
  const res = await fetch(`${url}/detect`, {
    method: "POST",
    body: transcript,
  });

  const timestamps = await res.json();
  return timestamps;
}

export interface SponsorInfo {
  timestamp: number;
}

export function matchPhrasesToTimestamps(
  phrases: ClassBlock[],
  timestamps: TranscriptItem[]
) {
  console.log(phrases.map((p) => p.phrase).join(""));
  console.log(timestamps.map((t) => t.w.trim()).join(" "));
  // const currTimeIdx = 0;
  // const allWords = [];
  // for (const phrase in phrases) {
  //   const wordsInPhrase = phrase.trim().split(" ");
  // }
}

export function getId(url: string): string | null {
  // From https://stackoverflow.com/a/9102270/9470078
  var idMatcher =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = url.match(idMatcher);
  if (match && match[2].length >= 11) {
    return match[2];
  } else {
    return null;
  }
}
