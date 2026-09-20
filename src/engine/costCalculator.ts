import { CountryCost, BudgetEvaluation, BudgetAssessment } from '../types/cost';
import { sourceStatus } from '../lib/dataIntegrity';

export function findCountryCost(
  countryName: string,
  costsByCountry: Record<string, CountryCost>
): CountryCost | undefined {
  const normalized = countryName.toLocaleLowerCase('vi-VN').trim();
  const countryAliases: Record<string, string> = {
    korea: 'Hàn Quốc',
    'south korea': 'Hàn Quốc',
    'hàn quốc': 'Hàn Quốc',
    japan: 'Nhật Bản',
    'nhật bản': 'Nhật Bản',
    taiwan: 'Đài Loan',
    'đài loan': 'Đài Loan',
    china: 'Trung Quốc',
    'trung quốc': 'Trung Quốc',
    usa: 'Mỹ',
    'united states': 'Mỹ',
    mỹ: 'Mỹ',
    australia: 'Úc',
    úc: 'Úc',
    germany: 'Đức',
    đức: 'Đức',
    france: 'Pháp',
    pháp: 'Pháp',
    finland: 'Phần Lan',
    'phần lan': 'Phần Lan',
    sweden: 'Thuỵ Điển',
    'thuỵ điển': 'Thuỵ Điển',
    'thụy điển': 'Thuỵ Điển',
    switzerland: 'Thuỵ Sỹ',
    'thụy sĩ': 'Thụy Sĩ',
    'thuỵ sỹ': 'Thuỵ Sỹ',
    italy: 'Ý',
    ý: 'Ý',
    spain: 'Tây Ban Nha',
    'tây ban nha': 'Tây Ban Nha',
    belgium: 'Bỉ',
    bỉ: 'Bỉ',
    norway: 'Na Uy',
    'na uy': 'Na Uy',
    russia: 'Nga',
    nga: 'Nga'
  };
  const aliasedCountry = countryAliases[normalized];
  let matchedCost: CountryCost | undefined;
  for (const cName in costsByCountry) {
    if (cName.toLocaleLowerCase('vi-VN').trim() === normalized
      || cName === aliasedCountry
      || normalized.includes(cName.toLocaleLowerCase('vi-VN').trim())) {
      matchedCost = costsByCountry[cName];
      break;
    }
  }

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

  return matchedCost;
}

export function evaluateBudget(
  countryName: string,
  userMonthlyBudgetVnd: number,
  stayMonths: number = 5,
  housingPreference: 'DORMITORY' | 'RENT' | 'ANY' = 'ANY',
  costsByCountry: Record<string, CountryCost>
): BudgetEvaluation {
  const matchedCost = findCountryCost(countryName, costsByCountry);

  if (!matchedCost) {
    return {
      status: 'NO_DATA',
      label: 'Chưa có dữ liệu chi phí chuẩn hóa',
      estimatedMonthlyMin: 0,
      estimatedMonthlyMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      userMonthlyBudget: userMonthlyBudgetVnd,
      warning: 'Quốc gia này chưa có dữ liệu chi phí đã audit trong tài liệu S27.',
      source: undefined
    };
  }

  if (!Number.isFinite(userMonthlyBudgetVnd) || userMonthlyBudgetVnd <= 0) {
    return {
      status: 'NEEDS_VERIFICATION',
      label: 'Chưa có ngân sách cá nhân để đối chiếu',
      estimatedMonthlyMin: 0,
      estimatedMonthlyMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      userMonthlyBudget: userMonthlyBudgetVnd,
      warning: 'Cần nhập ngân sách theo tháng trước khi kết luận phù hợp ngân sách.',
      source: matchedCost.source
    };
  }

  if (sourceStatus(matchedCost.source) !== 'VERIFIED') {
    return {
      status: 'NEEDS_VERIFICATION',
      label: 'Chi phí cần xác minh từ tài liệu nguồn',
      estimatedMonthlyMin: 0,
      estimatedMonthlyMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      userMonthlyBudget: userMonthlyBudgetVnd,
      warning: 'Dữ liệu chi phí hiện chưa được xác nhận từ file tài liệu nguồn tương ứng.',
      source: matchedCost.source
    };
  }

  // Check Swiss discrepancy flag
  const isSwiss = matchedCost.requiresVerification;

  // Calculate monthly living + housing
  const livingMin = matchedCost.livingCost.min;
  const livingMax = matchedCost.livingCost.max;

  if (livingMin === null || livingMax === null || matchedCost.livingCost.available === false) {
    return {
      status: matchedCost.requiresVerification ? 'NEEDS_VERIFICATION' : 'NO_DATA',
      label: matchedCost.requiresVerification ? 'Cần xác minh chi phí' : 'Chưa đủ dữ liệu chi phí',
      estimatedMonthlyMin: 0,
      estimatedMonthlyMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      userMonthlyBudget: userMonthlyBudgetVnd,
      warning: matchedCost.warningNote || 'Tài liệu nguồn chưa cung cấp đủ chi phí sinh hoạt.',
      source: matchedCost.source
    };
  }

  let housingMin = 0;
  let housingMax = 0;

  if (housingPreference === 'DORMITORY' && matchedCost.dormitoryCost.available !== false) {
    if (matchedCost.dormitoryCost.min === null || matchedCost.dormitoryCost.max === null) {
      return {
        status: 'NO_DATA', label: 'Chưa đủ dữ liệu KTX', estimatedMonthlyMin: 0, estimatedMonthlyMax: 0,
        estimatedTotalMin: 0, estimatedTotalMax: 0, userMonthlyBudget: userMonthlyBudgetVnd,
        warning: 'Tài liệu nguồn chưa có đủ chi phí KTX cho lựa chọn này.', source: matchedCost.source
      };
    }
    housingMin = matchedCost.dormitoryCost.min;
    housingMax = matchedCost.dormitoryCost.max;
  } else if (housingPreference === 'RENT' && matchedCost.rentCost.available !== false) {
    if (matchedCost.rentCost.min === null || matchedCost.rentCost.max === null) {
      return {
        status: 'NO_DATA', label: 'Chưa đủ dữ liệu thuê ngoài', estimatedMonthlyMin: 0, estimatedMonthlyMax: 0,
        estimatedTotalMin: 0, estimatedTotalMax: 0, userMonthlyBudget: userMonthlyBudgetVnd,
        warning: 'Tài liệu nguồn chưa có đủ chi phí thuê ngoài cho lựa chọn này.', source: matchedCost.source
      };
    }
    housingMin = matchedCost.rentCost.min;
    housingMax = matchedCost.rentCost.max;
  } else {
    const mins = [matchedCost.dormitoryCost.min, matchedCost.rentCost.min].filter((v): v is number => v !== null);
    const maxs = [matchedCost.dormitoryCost.max, matchedCost.rentCost.max].filter((v): v is number => v !== null);
    if (mins.length === 0 || maxs.length === 0) {
      return {
        status: 'NO_DATA', label: 'Chưa đủ dữ liệu nhà ở', estimatedMonthlyMin: 0, estimatedMonthlyMax: 0,
        estimatedTotalMin: 0, estimatedTotalMax: 0, userMonthlyBudget: userMonthlyBudgetVnd,
        warning: 'Tài liệu nguồn chưa có đủ dữ liệu nhà ở.', source: matchedCost.source
      };
    }
    housingMin = Math.min(...mins);
    housingMax = Math.max(...maxs);
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
    warning,
    source: matchedCost.source
  };
}
