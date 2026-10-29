import idiomFrequencyData from "./idiom-frequency.json";

export interface IdiomFrequency {
  word: string;
  count: number;
  xlsxMeaning?: string;
  pinyin?: string;
  explanation?: string;
  sourceText?: string;
  sourceBook?: string;
  example?: string;
  similar?: string[];
  opposite?: string[];
  usage?: string;
}

export const idiomFrequencyList: IdiomFrequency[] =
  idiomFrequencyData as IdiomFrequency[];