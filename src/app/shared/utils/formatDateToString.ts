export const formatDateToString = (date: Date, isDatetime?: boolean) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours() < 10 ? '0' + d.getHours() : '' + d.getHours();
  const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : '' + d.getMinutes();
  const seconds = d.getSeconds() < 10 ? '0' + d.getSeconds() : '' + d.getSeconds();
  const time = isDatetime && 'T' + hours + ':' + minutes + ':' + seconds;
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [year, month, day].join('-') + time;
};
