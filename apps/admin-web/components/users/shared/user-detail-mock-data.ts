/** Mock / deferred detail data — replace as F-ADMIN-USERS APIs land. */

export const USER_DETAIL_MOCK = {
  riskScore: 74,
  riskFactors: [
    { label: "refundRate", value: "25.5%", bad: true },
    { label: "unknownDevices", value: "2", bad: true },
    { label: "abnormalLogins", value: "3", bad: true },
    { label: "emailVerified", value: "verified", bad: false },
  ],
  recentActivity: [
    { icon: "suspend", text: "Account suspended by admin", time: "3 days ago" },
    { icon: "login", text: "New device login (iPhone 15)", time: "3 days ago" },
  ],
  permissionGroups: [
    {
      group: "booking",
      items: [
        { label: "viewCourts", inherited: true, direct: false },
        { label: "createBooking", inherited: true, direct: false },
        { label: "cancelBooking", inherited: false, direct: true },
      ],
    },
  ],
} as const;
