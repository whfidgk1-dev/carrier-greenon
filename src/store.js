import { createClient } from '@supabase/supabase-js';
import { initialAircon, missions, rewards } from './data.js';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=Boolean(url&&key&&!url.includes('YOUR_PROJECT'));
export const supabase=configured?createClient(url,key):null;

// 환경변수가 없는 동안에도 전체 화면 흐름을 학습할 수 있는 메모리 전용 데모 상태입니다.
const demo={user:{id:'demo',email:'demo@greenon.kr'},points:1000,level:'SEED',aircon:{...initialAircon},mission:null,transactions:[{id:'welcome',amount:1000,type:'earn',description:'GreenON 시작 선물',created_at:new Date().toISOString()}],orders:[]};
export const getDemo=()=>demo;

export async function signUp(email,password){if(!configured) return {error:new Error('Supabase 환경변수를 먼저 설정해 주세요.')};return supabase.auth.signUp({email,password,options:{emailRedirectTo:globalThis.location?.origin}});}
export async function signIn(email,password){if(!configured) return {error:new Error('Supabase 환경변수를 먼저 설정해 주세요.')};return supabase.auth.signInWithPassword({email,password});}
export async function signOut(){if(configured) await supabase.auth.signOut();}
export async function loadCloudState(user){
  const [profile,aircon,mission,transactions,orders,shop]=await Promise.all([
    supabase.from('profiles').select('*').eq('id',user.id).single(),
    supabase.from('aircon_status').select('*').eq('user_id',user.id).maybeSingle(),
    supabase.from('user_missions').select('*,missions(*)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('point_transactions').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    supabase.from('reward_orders').select('*,rewards(*)').eq('user_id',user.id).order('created_at',{ascending:false}),
    supabase.from('rewards').select('*').eq('is_active',true).order('points')]);
  const failure=[profile,aircon,mission,transactions,orders,shop].find(result=>result.error);
  if(failure) throw failure.error;
  const savedAircon=aircon.data;
  const normalizedAircon=savedAircon?{power:savedAircon.power,mode:savedAircon.mode.toUpperCase(),temperature:Number(savedAircon.temperature),fan:savedAircon.fan.toUpperCase(),minutes:savedAircon.runtime_minutes,filter:savedAircon.filter_percent,sensorOk:savedAircon.sensor_connected}:{...initialAircon};
  const normalizedMission=mission.data?{...mission.data,status:mission.data.status==='success'?'completed':mission.data.status}:null;
  const normalizedTransactions=transactions.data.map(item=>({...item,amount:item.transaction_type==='spend'?-item.amount:item.amount,description:item.title}));
  const normalizedOrders=orders.data.map(item=>({...item,points_spent:item.price}));
  const normalizedRewards=shop.data.map(item=>({...item,category:item.category.toUpperCase(),points:item.price}));
  return {user,points:profile.data.point_balance,level:profile.data.green_level.toUpperCase(),aircon:normalizedAircon,mission:normalizedMission,transactions:normalizedTransactions,orders:normalizedOrders,rewards:normalizedRewards};
}
export async function startMission(){return configured?supabase.rpc('start_my_green_mission'):null;}
export async function addMissionTime(){return configured?supabase.rpc('advance_my_green_mission'):null;}
export async function buyReward(id){return configured?supabase.rpc('purchase_my_green_reward',{p_reward_id:id}):null;}
export async function saveAircon(aircon){
  if(!configured) return null;
  return supabase.from('aircon_status').update({power:aircon.power,temperature:aircon.temperature,filter_percent:aircon.filter,sensor_connected:aircon.sensorOk,updated_at:new Date().toISOString()}).eq('user_id',(await supabase.auth.getUser()).data.user.id);
}
export {missions,rewards};
