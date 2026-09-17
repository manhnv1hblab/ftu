import { CountryCost, BudgetEvaluation, BudgetAssessment } from '../types/cost';

export function evaluateBudget(
  countryName: string,
  userMonthlyBudgetVnd: number,
  stayMonths: number = 5,
  housingPreference: 'DORMITORY' | 'RENT' | 'ANY' = 'ANY',
  costsByCountry: Record<string, CountryCost>
): BudgetEvaluation {
  // Normalize country name lookup
  let matchedCost: CountryCost | undefined;

  const normalized = countryName.toLowerCase().trim();
  for (const cName in costsByCountry) {
    if (cName.toLowerCase().trim() === normalized || normalized.includes(cName.toLowerCase().trim())) {
      matchedCost = costsByCountry[cName];
      break;
    }
  }

  // Fallback aliases
  if (!matchedCost) {
    if (normalized.includes('korea') || normalized.includes('hàn quốc')) {
      matchedCost = costsByCountry['Hàn Quốc'];
    } else if (normalized.includes('japan') || normalized.includes('nhật bản')) {
      matchedCost = costsByCountry['Nhật Bản'];
    } else if (normalized.includes('china') || normalized.includes('trung quốc')) {
      matchedCost = costsByCountry['Trung Quốc'];
    } else if (normalized.includes('taiwan') || normalized.includes('đài loan')) {
      matchedCost = costsByCountry['Đài Loan'];
    } else if (normalized.includes('france') || normalized.includes('pháp')) {
      matchedCost = costsByCountry['Pháp'];
    } else if (normalized.includes('germany') || normalized.includes('đức')) {
      matchedCost = costsByCountry['Đức'];
    } else if (normalized.includes('switzerland') || normalized.includes('thụy sĩ') || normalized.includes('thuỵ sỹ')) {
      matchedCost = costsByCountry['Thụy Sĩ'] || costsByCountry['Thuỵ Sỹ'];
    } else if (normalized.includes('usa') || normalized.includes('mỹ') || normalized.includes('united states')) {
      matchedCost = costsByCountry['Mỹ'];
    } else if (normalized.includes('canada')) {
      matchedCost = costsByCountry['Canada'];
    } else if (normalized.includes('australia') || normalized.includes('úc')) {
      matchedCost = costsByCountry['Úc'];
    }
  }

  if (!matchedCost) {
    return {
      status: 'NO_DATA',
      label: 'Chưa có dữ liệu chi phí chuẩn hóa',
      estimatedMonthlyMin: 0,
      estimatedMonthlyMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      userMonthlyBudget: userMonthlyBudgetVnd,
      warning: 'Quốc gia này chưa có trong bảng ước tính chi phí sinh hoạt S27 của FTU.'
    };
  }

  // Check Swiss discrepancy flag
  const isSwiss = matchedCost.requiresVerification;

  // Calculate monthly living + housing
  const livingMin = matchedCost.livingCost.min || 10;
  const livingMax = matchedCost.livingCost.max || 15;

  let housingMin = 0;
  let housingMax = 0;

  if (housingPreference === 'DORMITORY' && matchedCost.dormitoryCost.available !== false) {
    housingMin = matchedCost.dormitoryCost.min || 8;
    housingMax = matchedCost.dormitoryCost.max || 12;
  } else if (housingPreference === 'RENT' && matchedCost.rentCost.available !== false) {
    housingMin = matchedCost.rentCost.min || 12;
    housingMax = matchedCost.rentCost.max || 18;
  } else {
    // ANY: take lowest available min and highest available max
    const dMin = matchedCost.dormitoryCost.min ?? 8;
    const rMin = matchedCost.rentCost.min ?? dMin;
    housingMin = Math.min(dMin, rMin);

    const dMax = matchedCost.dormitoryCost.max ?? 12;
    const rMax = matchedCost.rentCost.max ?? dMax;
    housingMax = Math.max(dMax, rMax);
  }

  // In VNĐ (costs are in millions of VNĐ)
  const monthlyMin = (livingMin + housingMin) * 1_000_000;
  const monthlyMax = (livingMax + housingMax) * 1_000_000;
  const totalMin = monthlyMin * stayMonths + (matchedCost.oneTimeDepositFee ? matchedCost.oneTimeDepositFee * 1_000_000 : 0);
  const totalMax = monthlyMax * stayMonths + (matchedCost.oneTimeDepositFee ? matchedCost.oneTimeDepositFee * 1_000_000 : 0);

  let status: BudgetAssessment = 'WITHIN_BUDGET';
  let label = 'Trong ngân sách';
  let warning = isSwiss
    ? 'Lưu ý: Thụy Sĩ có 2 cột dữ liệu chênh lệch trong bảng gốc. Cần xác minh thêm trước khi chốt.'
    : undefined;

  if (isSwiss) {
    status = 'NEEDS_VERIFICATION';
    label = 'Cần kiểm tra lại dữ liệu Thụy Sĩ';
  } else if (userMonthlyBudgetVnd > 0) {
    if (userMonthlyBudgetVnd >= monthlyMax) {
      status = 'WITHIN_BUDGET';
      label = 'Trong ngân sách dự kiến';
    } else if (userMonthlyBudgetVnd >= monthlyMin) {
      status = 'NEAR_BUDGET';
      label = 'Sát mức trần ngân sách';
      warning = 'Chi phí có thể dao động vượt nhẹ ngân sách tùy vị trí nhà ở và thói quen chi tiêu.';
    } else {
      status = 'EXCEEDS_BUDGET';
      label = 'Vượt ngân sách dự kiến';
      warning = `Mức chi phí tối thiểu ước tính (${(monthlyMin / 1_000_000).toFixed(0)} tr VNĐ/tháng) cao hơn ngân sách của bạn (${(userMonthlyBudgetVnd / 1_000_000).toFixed(0)} tr VNĐ/tháng).`;
    }
  }

  return {
    status,
    label,
    estimatedMonthlyMin: monthlyMin,
    estimatedMonthlyMax: monthlyMax,
    estimatedTotalMin: totalMin,
    estimatedTotalMax: totalMax,
    userMonthlyBudget: userMonthlyBudgetVnd,
    warning
  };
}
