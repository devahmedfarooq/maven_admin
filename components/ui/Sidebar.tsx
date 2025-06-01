"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "antd";
import { HomeOutlined, ReadOutlined, UserOutlined, BookOutlined, AppstoreOutlined, TagsOutlined, LogoutOutlined, BoxPlotTwoTone, BoxPlotOutlined } from "@ant-design/icons";
import { logout } from "@/app/actions/auth";



const items = [
  { key: "", label: "Home", icon: <HomeOutlined /> },
  { key: "ads", label: "Ads", icon: <TagsOutlined /> },
  { key: "users", label: "Users", icon: <UserOutlined /> },
  { key: "bookings", label: "Bookings", icon: <BookOutlined /> },
  { key: "category", label: "Category", icon: <BoxPlotOutlined /> },
  { key: "blogs", label: "Blogs", icon: <ReadOutlined /> },
  { key: "items", label: "Items", icon: <AppstoreOutlined /> },
  {key : "logout", label : "Log out", icon : <LogoutOutlined />}
];

export default function SidebarMenu() {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState("home");

  const handleClick = async (e:any) => {
    if(e.key == 'logout') {
      await logout()
      return 
    }
    setSelectedKey(e.key);
    router.push(`/dashboard/${e.key}`); // Redirect to corresponding page
  };

  return (
    <Menu
      mode="inline"
      theme="light"
      selectedKeys={[selectedKey]}
      onClick={handleClick}
      items={items}
      style={{ paddingTop: 10 }}
    />
  );
}
