export const missions = [{ id:'eco-26', title:'26°C로 2시간 시원하게', description:'냉방 모드에서 설정 온도 26°C 이상을 유지해요.', reward_points:300, target_minutes:120 }];
export const rewards = [
  {id:'coffee',category:'FOOD',name:'아이스 아메리카노',description:'시원한 친환경 휴식',points:1200,emoji:'🥤'},
  {id:'tumbler',category:'LIFE',name:'GreenON 텀블러',description:'일회용 컵을 줄여요',points:3200,emoji:'🌱'},
  {id:'filter',category:'CARRIER',name:'에어컨 필터 쿠폰',description:'깨끗한 바람을 위한 쿠폰',points:5000,emoji:'❄️'}
];
export const initialAircon = {power:true,mode:'COOL',temperature:26,fan:'AUTO',minutes:0,filter:88,sensorOk:true};
