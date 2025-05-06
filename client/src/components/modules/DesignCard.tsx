import React, { useState } from "react";

import { Modal } from "antd";
import { useNavigate } from "react-router-dom";

import { DesignMetadataDto } from "../../../../dto/dto";
import deleteIcon from "../../assets/icons/delete.svg";
import { get, post } from "../../utils/requests";
import "./DesignCard.css";

interface DesignCardProps {
  design: DesignMetadataDto;
  setDesigns: (designs: Array<DesignMetadataDto>) => void;
}

const DesignCard: React.FC<DesignCardProps> = ({ design, setDesigns }) => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    navigate(`/editor/${design.cpID}`);
  };

  const handleDelete = async () => {
    try {
      await post(`/api/designs/delete/${design.cpID}`);
      const designs: Array<DesignMetadataDto> = await get("/api/designs");
      setDesigns(designs);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete design:", error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="Confirm Delete Crease Pattern"
        width={300}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleDelete}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: "#ff4d4f",
            borderColor: "#ff4d4f",
            color: "#fff",
          },
        }}
      ></Modal>
      <div className="Library-design">
        <div className="Design-titlebar">
          <h3 className="Design-title">{design.name}</h3>
          <img
            className="Design-delete"
            src={deleteIcon}
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <div className="Design-content" onClick={handleClick}>
          <p className="Design-desc">{design.description}</p>
          <p className="Design-desc">Created by: {design.creatorName}</p>
        </div>
        <p className="Design-footer">
          Created at: {new Date(design.dateCreated).toLocaleDateString()}
          <br />
          Last modified at:{" "}
          {new Date(design.dateLastModified).toLocaleDateString()}
        </p>
      </div>
    </>
  );
};

export default DesignCard;
