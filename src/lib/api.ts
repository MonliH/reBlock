const url =
  process.env.NODE_ENV == "development" ? "http://localhost:8080" : "something";

export function formatTime(seconds: number): string {
  let res = hms(seconds) as number[];
  res = res[0] != 0 ? res : res.slice(1);
  return res.map((v) => ("0" + v).slice(-2)).join(":");
}

export function chunk(inputArray: any[], size: number) {
  var R = [];
  for (var i = 0; i < inputArray.length; i += size) {
    R.push(inputArray.slice(i, i + size));
  }
  return R;
}

export function hms(totalSeconds: number): [number, number, number] {
  totalSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds];
}

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
  const rawTranscript = (await res.json()) as TranscriptItem[];
  const transcript: TranscriptItem[] = [];
  for (const line of rawTranscript) {
    for (const word of line.w.trim().split(" ")) {
      transcript.push({
        w: word,
        s: line.s,
        e: line.e,
      });
    }
  }
  return transcript;
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
  start: number;
  end: number;
  word: string;
  isSponsor: boolean;
}

export function matchPhrasesToTimestamps(
  phrases: ClassBlock[],
  timestamps: TranscriptItem[]
): SponsorInfo[] | null {
  let currTimeIdx = 0;
  const allWords: SponsorInfo[] = [];
  for (const phrase of phrases) {
    const wordsInPhrase = phrase.phrase.trim().split(" ");
    for (const word of wordsInPhrase) {
      if (word == timestamps[currTimeIdx].w.trim()) {
        allWords.push({
          start: timestamps[currTimeIdx].s,
          end: timestamps[currTimeIdx].e,
          word,
          isSponsor: phrase.sponsor,
        });
      } else {
        return null;
      }
      currTimeIdx++;
    }
  }

  return allWords;
}

export interface Span {
  start: number;
  end: number;
  isSponsor: boolean;
}

export function getSpans(words: SponsorInfo[]): Span[] {
  const spans: Span[] = [];
  let start = 0;
  let end = 0;
  let isSponsor = false;
  for (const word of words) {
    if (isSponsor !== word.isSponsor) {
      if (Math.abs(start - end) > 0) {
        spans.push({ start, end, isSponsor });
      }
      start = word.start;
      isSponsor = word.isSponsor;
    }

    end = word.end;
  }

  if (Math.abs(start - end) > 0) {
    spans.push({ start, end, isSponsor });
  }

  return spans;
}

export interface SpanWithWords extends Span {
  words: string[];
}

export function getSpansWithWord(words: SponsorInfo[]): SpanWithWords[] {
  const spans: SpanWithWords[] = [];
  let start = words[0].start;
  let end = words[0].end;
  let buff: string[] = [];
  let isSponsor = false;
  for (const word of words) {
    if (isSponsor !== word.isSponsor) {
      if (Math.abs(start - end) > 0) {
        spans.push({ start, end, isSponsor, words: buff });
      }
      buff = [];
      start = word.start;
      isSponsor = word.isSponsor;
    }

    buff.push(word.word);
    end = word.end;
  }

  if (Math.abs(start - end) > 0) {
    spans.push({ start, end, isSponsor, words: buff });
  }

  return spans;
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
