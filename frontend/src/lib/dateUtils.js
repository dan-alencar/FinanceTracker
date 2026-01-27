export const formatDate = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

export const formatMonth = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
};

export const getTodayString = (timeZone) => formatDate(new Date(), timeZone);

export const getYesterdayString = (timeZone) =>
  formatDate(new Date(Date.now() - 86400000), timeZone);

export const getCurrentMonth = (timeZone) => formatMonth(new Date(), timeZone);

export const getPreviousMonth = (timeZone) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthDate = new Date(firstOfMonth.getTime() - 86400000);
  return formatMonth(previousMonthDate, timeZone);
};
