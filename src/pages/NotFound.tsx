import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, Result } from "antd";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{ padding: 24 }}>
      <Result
        status="404"
        title="페이지를 찾을 수 없습니다"
        subTitle="요청하신 페이지가 존재하지 않습니다."
        extra={
          <Button type="primary" href="/">
            홈으로 이동
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
