const Page = {
  UserList: 0,
  VisitedMap: 1,
} as const;

type Page = (typeof Page)[keyof typeof Page];

export default Page;
