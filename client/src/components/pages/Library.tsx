import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";
import { Button, Menu, Modal, Form, Input, Flex, Card } from "antd";
import type { MenuProps } from "antd";
import { DesignMetadataDto, NewDesignDto } from "../../../../dto/dto";
import { get, post } from "../../utilities";

const Library: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return <p>Error: User context is not available.</p>;
  }

  const { userId, handleLogin, handleLogout } = context;

  if (!userId) {
    return <p>Error: You must be logged in to view this page.</p>;
  }

  const [designs, setDesigns] = useState<DesignMetadataDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate(); // Get the navigate function

  // Get metadata for all designs from server
  // TODO: later on, implement pagination in the /designs endpoint in case we have some
  // extremely prolific CP creators
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
        <Button onClick={() => setIsModalOpen(true)}>New Crease Pattern</Button>
      ),
    },
    {
      key: "logout",
      icon: (
        <Button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        >
          Logout
        </Button>
      ),
    },
  ];

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newDesign: NewDesignDto = {
        name: values.name,
        description: values.description,
      };
      await post("/api/designs", newDesign);
      setIsModalOpen(false);
      form.resetFields();
      // Refresh designs
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
