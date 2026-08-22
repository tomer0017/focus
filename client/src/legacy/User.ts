export interface User {
  id: string;
  username: string;
  profileImage: string;
  bannerImage: string;
  phoneNumber: string;
  mainColor: string;
  secondaryColor: string;
  socialLinks: { [key: string]: string };
  bio: string;
}
