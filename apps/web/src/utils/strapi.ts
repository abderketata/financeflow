const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const normalizeValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (!isObject(value)) {
    return value;
  }

  if ('data' in value) {
    return normalizeValue(value.data);
  }

  if ('attributes' in value && isObject(value.attributes)) {
    return {
      id: value.id,
      ...Object.fromEntries(Object.entries(value.attributes).map(([key, entry]) => [key, normalizeValue(entry)]))
    };
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]));
};

export const unwrapCollection = <T>(response: { data?: any[] }): T[] =>
  (response.data ?? []).map((item) => normalizeValue(item) as T);

export const unwrapSingle = <T>(response: { data?: any }): T | null => {
  if (!response.data) {
    return null;
  }

  return normalizeValue(response.data) as T;
};

