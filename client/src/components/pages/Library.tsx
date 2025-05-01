import React, { useContext, useEffect, useState } from "react";

import { Form, Input, Modal } from "antd";
import { useNavigate } from "react-router-dom";

import { DesignMetadataDto, NewDesignDto } from "../../../../dto/dto";
import NewIcon from "../../assets/icons/new.svg";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";
import DesignCard from "../modules/DesignCard";
import Navbar from "../modules/LandingNavbar";
import "./Library.css";

const Library: React.FC = () => {
  const navigate = useNavigate();

  const context = useContext(UserContext);

  if (!context) {
    return <p>Error: User context is not available.</p>;
  }

  const { userId } = context;

  if (!userId) {
    navigate("/login");
  }

  const [designs, setDesigns] = useState<DesignMetadataDto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

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
  }, [userId]);

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
    <>
      <Navbar />
      <div className="Library">
        <Modal
          className="Library-new-form"
          title="New Crease Pattern"
          open={isModalOpen}
          onCancel={handleCancel}
          onOk={handleSubmit}
          okText="Create"
          cancelText="Cancel"
        >
          <Form className="Library-new-form" form={form} layout="vertical">
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
        <div className="Library-design-list">
          {designs.map((design: DesignMetadataDto) => (
            <DesignCard
              design={design}
              setDesigns={setDesigns}
              key={design._id}
            />
          ))}
          <div className="Library-design">
            <div className="Library-new">
              <p>New Design</p>
              <button onClick={() => setIsModalOpen(true)}>
                <img className="Library-new-icon" src={NewIcon}></img>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Library;

// TODO: add functionality for deleting files
