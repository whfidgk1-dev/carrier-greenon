import {createClient} from '@supabase/supabase-js';
import {loadEnv} from 'vite';

const env=loadEnv('development',process.cwd(),'');
const url=env.VITE_SUPABASE_URL;
const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
const password=process.env.GREENON_E2E_PASSWORD;
const runId=process.argv[3]||Date.now();
const requestedEmail=['signup-email','verify-email','devices-email'].includes(process.argv[2])?process.argv[3]:null;
const emails=[requestedEmail||`edupro31470+greenon-a-${runId}@tamail.kr`];
const rlsTargetId='22222222-2222-4222-8222-222222222222';

if(!url||!key) throw new Error('Supabase 환경변수가 없습니다.');
if(!password) throw new Error('GREENON_E2E_PASSWORD 환경변수가 없습니다.');
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});

if(process.argv[2]==='signup'||process.argv[2]==='signup-email'){
  for(const email of emails){const {error}=await client().auth.signUp({email,password});if(error)throw error;}
  console.log(JSON.stringify({runId,emails}));
}else if(process.argv[2]==='devices-email'){
  const sessions=await Promise.all([client(),client()].map(async c=>{const {data,error}=await c.auth.signInWithPassword({email:emails[0],password});if(error)throw error;return {c,user:data.user};}));
  const snapshots=await Promise.all(sessions.map(({c})=>Promise.all([c.from('profiles').select('point_balance,green_level').single(),c.from('user_missions').select('status,progress_minutes,reward_granted'),c.from('reward_orders').select('id,price')])));
  for(const snapshot of snapshots)for(const result of snapshot)if(result.error)throw result.error;
  if(JSON.stringify(snapshots[0].map(x=>x.data))!==JSON.stringify(snapshots[1].map(x=>x.data)))throw new Error('기기별 데이터가 일치하지 않습니다.');
  console.log(JSON.stringify({device1:'PASS',device2:'PASS',persisted:'PASS',balance:snapshots[0][0].data.point_balance}));
  await Promise.all(sessions.map(({c})=>c.auth.signOut()));
}else if(process.argv[2]==='verify'||process.argv[2]==='verify-email'){
  const first=client();const {data,error}=await first.auth.signInWithPassword({email:emails[0],password});if(error)throw error;const firstUser=data.user;
  let result=await first.from('aircon_status').update({power:true,mode:'cool',temperature:26,filter_percent:100,sensor_connected:true}).eq('user_id',firstUser.id).select();if(result.error)throw result.error;
  result=await first.rpc('start_my_green_mission');if(result.error)throw result.error;
  for(let i=0;i<4;i++){result=await first.rpc('advance_my_green_mission');if(result.error)throw result.error;}
  const profile=await first.from('profiles').select('*').single();if(profile.error)throw profile.error;
  if(profile.data.point_balance!==300)throw new Error(`미션 포인트 불일치: ${profile.data.point_balance}`);
  const reward=await first.from('rewards').select('*').eq('is_active',true).order('price').limit(1).single();if(reward.error)throw reward.error;
  result=await first.rpc('purchase_my_green_reward',{p_reward_id:reward.data.id});if(result.error)throw result.error;
  const [profileAfter,orders,transactions,crossProfiles,crossWrite]=await Promise.all([
    first.from('profiles').select('*').single(),first.from('reward_orders').select('*'),first.from('point_transactions').select('*'),first.from('profiles').select('*'),first.from('aircon_status').update({temperature:18}).eq('user_id',rlsTargetId).select()
  ]);
  for(const check of [profileAfter,orders,transactions,crossProfiles,crossWrite])if(check.error)throw check.error;
  if(profileAfter.data.point_balance!==50||orders.data.length!==1||transactions.data.length!==2)throw new Error('포인트/구매 기록 검증 실패');
  if(crossProfiles.data.length!==1||crossWrite.data.length!==0)throw new Error('RLS 사용자 분리 검증 실패');
  console.log(JSON.stringify({auth:'PASS',mission:'PASS',points:'PASS',purchase:'PASS',rls:'PASS',balance:profileAfter.data.point_balance}));
  await first.auth.signOut();
}else{
  throw new Error('signup 또는 verify 모드를 지정하세요.');
}
