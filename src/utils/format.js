export const postTypeLabels = {
  IN_PROGRESS: '준비/진행',
  COMPLETED: '완료',
};

export const courseStatusLabels = {
  NORMAL: '정상',
  CAUTION: '주의',
  CONSTRUCTION: '공사',
  CLOSED: '통제',
};

export function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCount(value) {
  return new Intl.NumberFormat('ko-KR').format(value || 0);
}

export function toFormData(payload, fileFields = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value == null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
      return;
    }

    formData.append(key, value);
  });

  Object.entries(fileFields).forEach(([key, files]) => {
    if (!files) return;
    Array.from(files).forEach((file) => formData.append(key, file));
  });

  return formData;
}

export function getErrorMessage(error, fallback = '요청에 실패했습니다.') {
  return error?.message || fallback;
}
