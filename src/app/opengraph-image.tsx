import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "정민나니 스케줄 공유 미리보기";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7faf8",
          color: "#14211f",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 56,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#ffffff",
            border: "2px solid #d8e3df",
            borderRadius: 28,
            boxShadow: "0 24px 80px rgba(20, 33, 31, 0.16)",
            display: "flex",
            gap: 56,
            height: "100%",
            justifyContent: "space-between",
            padding: 52,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              width: 520,
            }}
          >
            <div
              style={{
                color: "#159a86",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              Shared Calendar
            </div>
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 1.05,
              }}
            >
              정민나니 스케줄
            </div>
            <div
              style={{
                color: "#52645f",
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.35,
              }}
            >
              함께 일정을 정리하고 To-do까지 챙기는 공유 스케줄러
            </div>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 12,
                marginTop: 10,
              }}
            >
              {["일정", "할 일", "공유"].map((item) => (
                <div
                  key={item}
                  style={{
                    background: "#eefaf7",
                    border: "1px solid #bfe2da",
                    borderRadius: 999,
                    color: "#146c61",
                    fontSize: 24,
                    fontWeight: 800,
                    padding: "10px 18px",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#14211f",
              borderRadius: 30,
              display: "flex",
              flexDirection: "column",
              height: 420,
              overflow: "hidden",
              padding: 0,
              width: 420,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#159a86",
                display: "flex",
                height: 86,
                justifyContent: "space-between",
                padding: "0 34px",
              }}
            >
              <div style={{ color: "#ffffff", fontSize: 30, fontWeight: 900 }}>APR</div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "#ffffff", borderRadius: 12, height: 28, width: 18 }} />
                <div style={{ background: "#ffffff", borderRadius: 12, height: 28, width: 18 }} />
              </div>
            </div>
            <div
              style={{
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                height: 334,
                padding: 30,
              }}
            >
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} style={{ display: "flex", gap: 14 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((column) => {
                    const day = row * 7 + column + 1;
                    const selected = day === 24;
                    const hasPlan = [4, 12, 18, 24, 29].includes(day);

                    return (
                      <div
                        key={`${row}-${column}`}
                        style={{
                          alignItems: "center",
                          background: selected ? "#14211f" : "#f7faf8",
                          border: selected ? "0" : "1px solid #d8e3df",
                          borderRadius: 12,
                          color: selected ? "#ffffff" : "#14211f",
                          display: "flex",
                          flexDirection: "column",
                          fontSize: 20,
                          fontWeight: 900,
                          height: 44,
                          justifyContent: "center",
                          position: "relative",
                          width: 44,
                        }}
                      >
                        {day}
                        {hasPlan ? (
                          <div
                            style={{
                              background: selected ? "#f6c177" : "#159a86",
                              borderRadius: 999,
                              bottom: 5,
                              height: 6,
                              position: "absolute",
                              width: 18,
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
