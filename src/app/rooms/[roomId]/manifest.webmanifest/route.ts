export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const encodedRoomId = encodeURIComponent(roomId);

  return Response.json(
    {
      name: "\uacf5\uc720 \uc77c\uc815 \uad00\ub9ac",
      short_name: "\uacf5\uc720 \uc77c\uc815",
      description: "\ud574\ub2f9 \ubc29\uc758 \uacf5\uc720 \ub2ec\ub825\uc73c\ub85c \ubc14\ub85c \uc774\ub3d9\ud569\ub2c8\ub2e4.",
      start_url: `/rooms/${encodedRoomId}/calendar`,
      scope: `/rooms/${encodedRoomId}/`,
      display: "standalone",
      background_color: "#f7faf8",
      theme_color: "#159a86",
      icons: [
        {
          src: "/calendar-shortcut.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
      },
    },
  );
}
