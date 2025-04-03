import React, { useContext, useEffect, useState } from "react";

import { googleLogout } from "@react-oauth/google";
import { Button, Card, Flex, Form, Input, Menu, Modal } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";

import {
  ClientCPDto,
  DesignMetadataDto,
  NewDesignDto,
  ServerCPDto,
} from "../../../../dto/dto";
import LogoutIcon from "../../assets/icons/logout.svg";
import NewIcon from "../../assets/icons/new.svg";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";

const Library: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return <p>Error: User context is not available.</p>;
  }

  const { userId, handleLogin, handleLogout } = context;

  if (!userId) {
    return <p>Error: You must be logged in to view this page.</p>;
  }

  //setDesigns will update/rerender the page
  const [designs, setDesigns] = useState<DesignMetadataDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate(); // Get the navigate function

  // Get metadata for all designs from server
  // TODO: later on, implement pagination in the /designs endpoint in case we have some
  // extremely prolific CP creators
  useEffect(() => {
    const getDesigns = async () => {
      try {
        const designs: Array<DesignMetadataDto> = await get("/api/designs");
        setDesigns(designs);
        console.log("Fetched designs:", designs);
      } catch (error) {
        console.error("Failed to fetch designs:", error);
      }
    };

    getDesigns();
  }, []);

  const items: MenuProps["items"] = [
    {
      label: "Some other pages that don't exist yet",
      key: "app",
    },
    {
      key: "new",
      icon: (
        <img
          src={NewIcon}
          alt="New crease pattern"
          style={{ width: "50px" }}
          onClick={() => setIsModalOpen(true)}
        />
      ),
    },
    {
      key: "logout",
      icon: (
        <img
          src={LogoutIcon}
          alt="Logout"
          style={{ width: "50px" }}
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        />
      ),
    },
  ];

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // const templateStarterFile = JSON.stringify({
  //   vertices_coords: [[0, 0], [1, 0], [1, 1], [0, 1]],
  //   edges_vertices: [[0, 1], [1, 2], [2, 3], [3, 0]],
  //   edges_assignment: ["B", "B", "B", "B"],
  //   edges_foldAngle: [0, 0, 0, 0],
  // });
  const templateStarterFile: ClientCPDto = {
    vertices_coords: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    edges_vertices: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 2],
    ],
    edges_assignment: ["B", "B", "B", "B", "M"],
    edges_foldAngle: [0, 0, 0, 0, 180],
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newDesign: NewDesignDto = {
        name: values.name,
        description: values.description,
        content: templateStarterFile,
      };
      await post("/api/designs", newDesign);
      setIsModalOpen(false);
      form.resetFields();
      // Refresh designs
      //get designs from current user
      const designs: Array<DesignMetadataDto> = await get("/api/designs");
      setDesigns(designs);
    } catch (error) {
      console.error("Failed to create new design:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Menu mode="horizontal" items={items} />
      <Modal
        title="New Crease Pattern"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText="Create"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter the description" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
      <Flex wrap>
        {designs.map((design: DesignMetadataDto) => (
          <div className="m-2" key={design._id}>
            <Card title={design.name} variant="borderless">
              <p>{design.description}</p>
              <p>Creator: {design.creatorName}</p>
              <Button
                type="default"
                onClick={() => {
                  navigate(`/editor/${design.cpID}`);
                }}
              >
                Edit
              </Button>
            </Card>
          </div>
        ))}
      </Flex>
    </div>
  );
};

export default Library;

//TODO: add functionality for deleting files
