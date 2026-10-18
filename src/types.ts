export type ProblemStatus = "todo" | "progress" | "solved" | "revisit";
export type DayStatus = "not" | "progress" | "done";
export type Problem = { id:number; name:string; category:string; difficulty:string; status:ProblemStatus; url:string; notes:string };
export type JournalEntry = { minutes:number; attempted:number; solved:number; learned:string; blockers:string; next:string };
export type WeeklyReview = { confidence:number; wins:string; weaknesses:string; adjustment:string };
export type TrackerState = {
  startDate:string;
  statuses:Record<number,DayStatus>;
  checks:Record<number,number[]>;
  journal:Record<string,JournalEntry>;
  problems:Problem[];
  reviews:Record<number,WeeklyReview>;
  nextId:number;
};
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
export const defaultState = ():TrackerState => ({
  startDate:todayISO(),statuses:{},checks:{},journal:{},
  problems:[],reviews:{},nextId:1
});
export const dateOffset = (date:string,n:number) => {
  const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
export const prettyDate = (date:string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"});
export const dayNumber = (startDate:string) => {
  const a=new Date(`${startDate}T12:00:00`),b=new Date(`${todayISO()}T12:00:00`);
  return Math.max(1,Math.min(42,Math.floor((b.getTime()-a.getTime())/86400000)+1));
};