import { useEffect, useState } from "react";

const useQueryParams = () => {
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramsObject: Record<string, string> = {};

    params.forEach((value, key) => {
      paramsObject[key] = value;
    });

    setQueryParams(paramsObject);
  }, []);

  return queryParams;
};

export default useQueryParams;
