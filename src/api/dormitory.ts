import axios from "axios";

const DORM_BASE = "https://happydorm.sejong.ac.kr";

export interface DormDayMenu {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  alternative: string;
}

export interface DormWeeklyMenu {
  today: string;
  days: DormDayMenu[];
}

/**
 * Fetch weekly dormitory meal menu from happydorm.sejong.ac.kr.
 * No authentication required.
 * @param date - Any date in the target week (YYYY-MM-DD). Empty = current week.
 */
export async function getDormWeeklyMenu(date?: string): Promise<DormWeeklyMenu> {
  const resp = await axios.get(`${DORM_BASE}/food/getWeeklyMenu.do`, {
    params: { locgbn: "SJ", sch_date: date || "" },
    timeout: 10000,
  });

  const data = resp.data?.root?.[0]?.WEEKLYMENU?.[0];
  if (!data) throw new Error("Dormitory menu data not available");

  const days: DormDayMenu[] = [];
  for (let i = 1; i <= 7; i++) {
    days.push({
      date: data[`fo_date${i}`] || "",
      breakfast: data[`fo_menu_mor${i}`] || "",
      lunch: data[`fo_menu_lun${i}`] || "",
      dinner: data[`fo_menu_eve${i}`] || "",
      alternative: data[`fo_sub_menu${i}`] || "",
    });
  }

  return { today: data.today || "", days };
}
