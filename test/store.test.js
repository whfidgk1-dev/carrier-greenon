import {describe,it,expect} from 'vitest';
import {missions,rewards,initialAircon} from '../src/data.js';
describe('GreenON 기본 데이터',()=>{it('미션 보상과 시간이 유효하다',()=>{expect(missions[0].target_minutes).toBe(120);expect(missions[0].reward_points).toBe(300)});it('모든 상품 가격이 양수다',()=>expect(rewards.every(r=>r.points>0)).toBe(true));it('초기 에어컨은 미션 조건을 만족한다',()=>{expect(initialAircon.temperature).toBeGreaterThanOrEqual(26);expect(initialAircon.sensorOk).toBe(true)})});
