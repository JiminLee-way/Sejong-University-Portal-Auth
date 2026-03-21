import { createSjappClient, unwrap } from "../http.js";
import type { ApiResponse } from "../types.js";

export interface Building {
  buildingId: number;
  buildingName: string;
  location: string;
  fileId?: string;
  active: boolean;
}

export interface Place {
  placeId: number;
  buildingId: number;
  buildingName: string;
  placeName: string;
  operationType: string;
  active: boolean;
}

export interface MenuItem {
  menuId: number;
  placeId: number;
  menuName: string;
  menuImageUrl: string;
  defaultPrice: number;
  calories: number;
  allergyInfo: string;
  active: boolean;
}

export interface MealType {
  mealTypeId: number;
  placeId: number;
  mealName: string;
  basePrice: number;
  sortOrder: number;
  active: boolean;
}

const client = () => createSjappClient();

export async function getBuildings(): Promise<Building[]> {
  const resp = await client().get<ApiResponse<Building[]>>("/api/publicapi/food/buildings");
  return unwrap(resp);
}

export async function getPlaces(buildingId: number): Promise<Place[]> {
  const resp = await client().get<ApiResponse<Place[]>>(`/api/publicapi/food/buildings/${buildingId}/places`);
  return unwrap(resp);
}

export async function getMenus(placeId: number): Promise<MenuItem[]> {
  const resp = await client().get<ApiResponse<MenuItem[]>>(`/api/publicapi/food/menus/places/${placeId}`);
  return unwrap(resp);
}

export async function getMealTypes(placeId: number): Promise<MealType[]> {
  const resp = await client().get<ApiResponse<MealType[]>>(`/api/publicapi/food/places/${placeId}/meal-types`);
  return unwrap(resp);
}

/** 날짜별 식단 스케줄 (조식/중식/석식 메뉴) */
export async function getScheduleByDate(date: string, placeId: number): Promise<unknown[]> {
  const resp = await client().get<ApiResponse<unknown[]>>(`/api/publicapi/food/schedules/date/${date}`, { params: { placeId } });
  return unwrap(resp);
}
