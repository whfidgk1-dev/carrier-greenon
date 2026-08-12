export const missions = [{ id:'eco-26', title:'26°C로 2시간 시원하게', description:'냉방 모드에서 설정 온도 26°C 이상을 유지해요.', reward_points:300, target_minutes:120 }];
export const weatherLocation = '광주';

// 실제 날씨 API 없이도 시간별 화면을 학습할 수 있도록 광주의 여름 하루 기온을 가상 데이터로 구성합니다.
const hourlyTemperatures = [25,24,24,23,23,24,25,26,27,28,29,30,31,32,32,31,30,29,28,27,27,26,26,25];

export function getHourlyWeather(baseDate=new Date()){
  const startHour=baseDate.getHours();
  return Array.from({length:24},(_,offset)=>{
    const totalHour=startHour+offset;
    const hour=totalHour%24;
    const dayOffset=Math.floor(totalHour/24)-Math.floor(startHour/24);
    const isDaytime=hour>=6&&hour<19;
    return {
      hour,
      label:offset===0?'지금':`${dayOffset>0?'내일 ':''}${String(hour).padStart(2,'0')}시`,
      temperature:hourlyTemperatures[hour],
      condition:isDaytime?'맑음':'맑은 밤',
      icon:isDaytime?'☀️':'🌙'
    };
  });
}

export const rewards = [
  {id:'coffee',category:'FOOD',name:'아이스 아메리카노',description:'시원한 친환경 휴식',points:1200,emoji:'🥤'},
  {id:'tumbler',category:'LIFE',name:'GreenON 텀블러',description:'일회용 컵을 줄여요',points:3200,emoji:'🌱'},
  {id:'filter',category:'CARRIER',name:'에어컨 필터 쿠폰',description:'깨끗한 바람을 위한 쿠폰',points:5000,emoji:'❄️'}
];
export const initialAircon = {power:true,mode:'COOL',temperature:26,fan:'AUTO',minutes:0,filter:88,sensorOk:true};
