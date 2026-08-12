const responseConfig = {
  SUCCESS: { value: 200, label: '请求成功' },
  ERROR: { value: 500, label: '请求失败' },
} as const;

export const RESPONSE = {
  SUCCESS: responseConfig.SUCCESS.value,
  ERROR: responseConfig.ERROR.value,
  label: (value: number) => (
    value === responseConfig.SUCCESS.value
      ? responseConfig.SUCCESS.label
      : responseConfig.ERROR.label
  ),
};
